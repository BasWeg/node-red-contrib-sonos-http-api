import SonosHelper from "./SonosHelper";
import SonosClient from './SonosClient';
import { ConfigNode } from './SonosClient';
import { Node } from "node-red";

module.exports = function (RED) {
	'use strict';
	var helper = new SonosHelper();
	function Node(n) {

		RED.nodes.createNode(this, n);
		var node = this;
		var configNode = RED.nodes.getNode(n.confignode);

		var isValid = helper.validateConfigNode(node, configNode);
		if (!isValid)
			return;

		node.status({});

		node.on('input', (msg) => {
			helper.preprocessInputMsg(node, configNode, msg, (device) => {
				getSonosCurrentQueue(node, msg, device.player, configNode);
			});
		});
	}

	function getSonosCurrentQueue(node: Node, msg, player:string, configNode: ConfigNode) {
		var client = new SonosClient(player, configNode);
		if (client === null || client === undefined) {
			node.status({ fill: "red", shape: "dot", text: "sonos client is null" });
			return;
		}

		client.getQueue((err, queueObj) => {
			if (err) {
				if (err === "{}") {
					node.error(JSON.stringify(err));
					node.status({ fill: "blue", shape: "dot", text: "queue is empty" });
					msg.payload = [];
					node.send(msg);
				}
				else {
					node.error(JSON.stringify(err));
					node.status({ fill: "red", shape: "dot", text: "failed to retrieve current queue" });
				}
				return;
			}
			if (queueObj === null || queueObj === undefined || queueObj.items === undefined || queueObj.items === null) {
				node.status({ fill: "red", shape: "dot", text: "invalid current queue retrieved" });
				return;
			}

			var tracksArray = queueObj.items;
			msg.payload = tracksArray;
			node.send(msg);
		});
	}

	RED.nodes.registerType('sonos-http-api-get-queue', Node);
};
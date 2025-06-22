import { IJsonModel } from "flexlayout-react";
import { LayoutNode, Tab } from "./layoutAgent";

/**
 * Convert our LayoutNode format to FlexLayout JSON format
 */
export function layoutNodeToFlexLayout(layout: LayoutNode): IJsonModel {
	const convertNode = (node: LayoutNode): any => {
		if (node.type === "tabset") {
			const tabs =
				node.tabs?.map((tab) => ({
					type: "tab",
					id: tab.id,
					name: tab.title,
					component: "content",
					config: tab.config,
				})) || [];

			const activeIndex =
				node.tabs?.findIndex((tab) => tab.id === node.activeTabId) || 0;

			console.log("🔄 Converting tabset:", {
				nodeId: node.id,
				tabs: node.tabs,
				activeTabId: node.activeTabId,
				activeIndex,
				convertedTabs: tabs,
			});

			return {
				type: "tabset",
				id: node.id,
				weight: node.weight || 50,
				children: tabs,
				active: Math.max(0, activeIndex), // Ensure non-negative
			};
		} else {
			// row or column
			return {
				type: node.type,
				id: node.id,
				weight: node.weight || 50,
				children: node.children?.map((child: any) => convertNode(child)) || [],
			};
		}
	};

	return {
		global: {
			borderSize: 25,
		},
		borders: [],
		layout: convertNode(layout),
	};
}

/**
 * Convert FlexLayout JSON format to our LayoutNode format
 */
export function flexLayoutToLayoutNode(flexModel: IJsonModel): LayoutNode {
	const convertNode = (node: any): LayoutNode => {
		if (node.type === "tabset") {
			const tabs: Tab[] =
				node.children?.map((child: any) => ({
					id: child.id,
					title: child.name,
					contentId: child.config?.contentType || "default",
					config: child.config,
				})) || [];

			const activeTabIndex = node.active || 0;
			const activeTabId = tabs[activeTabIndex]?.id;

			return {
				id: node.id,
				type: "tabset",
				weight: node.weight,
				tabs,
				activeTabId,
			};
		} else {
			// row or column
			return {
				id: node.id,
				type: node.type,
				weight: node.weight,
				children: node.children?.map((child: any) => convertNode(child)) || [],
			};
		}
	};

	return convertNode(flexModel.layout);
}

/**
 * Generate a unique ID for new nodes
 */
export function generateNodeId(prefix: string = "node"): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Find a node by ID in the layout tree
 */
export function findNodeInLayout(
	layout: LayoutNode,
	id: string
): LayoutNode | null {
	if (layout.id === id) return layout;

	if (layout.children) {
		for (const child of layout.children) {
			const found = findNodeInLayout(child, id);
			if (found) return found;
		}
	}

	return null;
}

/**
 * Validate that a layout conforms to depth-2 rule
 */
export function validateLayoutDepth(
	layout: LayoutNode,
	currentDepth = 0
): boolean {
	if (layout.type === "tabset") return currentDepth <= 2;

	if (layout.children) {
		return layout.children.every((child) =>
			validateLayoutDepth(child, currentDepth + 1)
		);
	}

	return true;
}

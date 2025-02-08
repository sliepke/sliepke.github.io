const tablist = document.querySelector('[role="tablist"]');
const tabs = tablist.querySelectorAll('[role="tab"]');

// assume exactly 1 tab has aria-selected of true, and it is the first tab in DOM order
let selectedTabIndex = 0;
let selectedTab = tabs.item(0);

function normalMod(a, b) {
	r = a % b;
	return (Math.sign(r) === -1) ? (b + r) : r;
}

function changeSelectedTab(newTabIndex) {
	// remove previously selected tab from tab sequence (not navigatable to with TAB key), set its aria-selected attribute to false, and hide its tabpanel
	selectedTab.setAttribute("aria-selected", "false");
	selectedTab.tabIndex = -1;
	document.querySelector("#" + selectedTab.getAttribute("aria-controls")).removeAttribute("class");
	
	// do the opposite stuff for the now selected tab
	selectedTabIndex = newTabIndex;
	selectedTab = tabs.item(newTabIndex);
	
	selectedTab.setAttribute("aria-selected", "true");
	selectedTab.tabIndex = 0;
	document.querySelector("#" + selectedTab.getAttribute("aria-controls")).className = "selected";
}

tablist.addEventListener("keydown", (e) => {
	// determine the tab element to select
	let newTabIndex = 0;
	if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
		newTabIndex = normalMod(selectedTabIndex - 1, tabs.length);
	} else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
		newTabIndex = normalMod(selectedTabIndex + 1, tabs.length);
	} else {
		return;
	}
	
	changeSelectedTab(newTabIndex);
	selectedTab.focus();
});

for (let i = 0; i < tabs.length; i++) {
	let tab = tabs.item(i);
	tab.addEventListener("mousedown", (e) => {
		changeSelectedTab(i);
	});
}

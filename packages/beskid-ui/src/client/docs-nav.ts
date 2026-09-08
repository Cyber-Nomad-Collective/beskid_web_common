import { bindDocAreaNavTopSync, initDocAreaNav } from './doc-area-nav';
import { onPageNavigation } from './view-transition-lifecycle';

function initDocsNav() {
	initDocAreaNav({
		chromeSelector: '[data-docs-nav-chrome]',
		railSelector: '[data-docs-nav-rail]',
		backdropSelector: '[data-docs-nav-backdrop]',
		mobileToggleSelector: '[data-docs-nav-mobile-toggle]',
		closeSelector: '[data-docs-nav-close]',
		filterSelector: '[data-docs-nav-filter]',
		treeItemSelector: '.platform-spec-nav-tree__item',
		treeLinkSelector: '.platform-spec-nav-tree__link',
		defaultCollapsed: false,
	});
}

onPageNavigation(initDocsNav);
bindDocAreaNavTopSync();

/// Hello, potential plugin users.
/// This plugin supports a specific variant of Djot that supports arbitrary tags that's different from the [official Djot syntax](https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html).
/// 
/// With this plugin, you can write:
/// 
/// :::: details
/// ::: summary
/// summary here
/// :::
/// detailed description here
/// ::::
///
/// That's all the difference in syntax.
/// 
/// ## Usage
/// 
/// import djot from "https://cdn.jsdelivr.net/gh/iacore/djot.js@GIT_COMMIT_HASH/lume-djot-plugin.ts"

import {
  parse,
  renderHTML,
  applyFilter,
} from "./src/index.ts";
import {
  type HTMLRenderOptions,
} from "./src/html.ts";
import {
  type ParseOptions,
} from "./src/parse.ts";

import loader from "lume/core/loaders/text.ts";
import { merge } from "lume/core/utils/object.ts";

import type Site from "lume/core/site.ts";
import type { Engine } from "lume/core/renderer.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Options passed to djot library */
  parseOptions?: ParseOptions;

  /** Options passed to djot library */
  renderOptions?: HTMLRenderOptions;
}

// Default options
export const defaults: Options = {
  extensions: [".dj", ".djot"],
};

/** Template engine to render Markdown files */
export class DjotEngine implements Engine {
  parseOptions: ParseOptions;
  renderOptions: HTMLRenderOptions;

  constructor() {
  }

  deleteCache() { }

  render(
    content: string,
    data?: Record<string, unknown>,
    filename?: string,
  ): string {
    return this.renderComponent(content, data, filename);
  }

  renderComponent(
    content: unknown,
    data?: Record<string, unknown>,
    filename?: string,
  ): string {
    if (typeof content !== "string") {
      content = String(content);
    }
    const doc = parse(content as string, this.parseOptions);
    applyFilter(doc, () => ({
      section: (el) => {
        if (el.children.length > 0) el.children[0].attributes = el.attributes
        return el.children;
      },
    }))
    return renderHTML(doc, this.renderOptions);
  }

  addHelper() { }
}

function render(doc) {
}

/** Register the plugin to support Djot */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    // Load the pages
    site.loadPages(options.extensions, {
      loader,
      engine: new DjotEngine(),
    });

    // Register the md filter
    site.filter("dj", filter);

    function filter(string: string, inline = false): string {
      const content = string?.toString() || "";
      const doc = parse(content, {});
      return renderHTML(doc, {});
    }
  };
}

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/markdown/ */
      dj: (string: string, inline?: boolean) => string;
    }
  }
}

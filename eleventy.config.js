import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import fontAwesomePlugin from "@11ty/font-awesome";
import pluginFilters from "./_config/filters.js";
import markdownIt from "markdown-it";
import embedYouTube from "eleventy-plugin-youtube-embed";
import eleventyPluginYoutubeEmbed from 'eleventy-plugin-youtube-embed';
import yaml from "js-yaml";
import minifyHtml from "@minify-html/node";
import CleanCSS from "clean-css";
import fs from "node:fs";
/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function(eleventyConfig) {
	eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
		if(data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
			return false;
		}
	});
	eleventyConfig.addPlugin(embedYouTube, {
  lite: true,
});
eleventyConfig.addPlugin(eleventyPluginYoutubeEmbed);
eleventyConfig.addPlugin(fontAwesomePlugin);
	eleventyConfig
		.addPassthroughCopy({
			"./public/": "/"
		})
		.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl")
		.addPassthroughCopy("xmit.json");
	eleventyConfig.addWatchTarget("css/**/*.css");
	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpg,jpeg,gif}");
	eleventyConfig.addBundle("css", {
		toFileDirectory: "dist",
		bundleHtmlContentFromSelector: "style",
	});

	eleventyConfig.addBundle("js", {
		toFileDirectory: "dist",
		bundleHtmlContentFromSelector: "script",
		transforms: [
            function(content) {
                if (this.type === "css") {
                    return new CleanCSS({}).minify(content).styles;
                }
                return content;
            }
        ]
	});

eleventyConfig.addTransform("minify-html", function (content) {
	const isProduction = process.env.NODE_ENV === "production";
	if (!isProduction || !this.page.outputPath || !this.page.outputPath.endsWith(".html")) {
		return content;
	}

	try {
		const result = minifyHtml.minify(Buffer.from(content), {
			keep_closing_tags: true,
			keep_comments: false,
			keep_html_and_head_opening_tags: false,
			keep_spaces_between_attributes: false,
			minify_css: true,
			minify_js: true,
			remove_bangs: true,
			remove_processing_instructions: true,
		});
		return result.toString();
	} catch (err) {
		console.error("minify-html failed:", err);
		return content;
	}
});

eleventyConfig.on("eleventy.after", async () => {
	if (process.env.NODE_ENV !== "production") return;
	const { PurgeCSS } = await import("purgecss");
	try {
		const purgeCSSResult = await new PurgeCSS().purge({
			content: ["_site/**/*.html"],
			css: ["_site/css/index.css"],
			safelist: {
				standard: [
					/^btn/, /^navbar/, /^nav-/, /^container/, /^row/, /^col-/, /^ratio/, /^modal/,
					/^bg-/, /^text-/, /^d-/, /^ms-/, /^me-/, /^mt-/, /^mb-/, /^p-/, /^g-/, /^fs-/,
					/^fw-/, /^h\d$/, /^w-/, /^lh-/, /^opacity-/, /^tracking-/, /^serif/, /^zoom/
				]
			}
		});

		if (purgeCSSResult[0] && purgeCSSResult[0].css) {
			await fs.promises.writeFile("_site/css/index.css", purgeCSSResult[0].css, "utf8");
		}
	} catch (err) {
		console.error("PurgeCSS failed:", err);
	}
});

	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 }
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
	let md = new markdownIt({ html: true });
	eleventyConfig.addFilter("markdown", (content) => md.render(content));
	eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));
	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom", // or "rss", "json"
		outputPath: "/feed/feed.xml",
		stylesheet: "pretty-atom-feed.xsl",
		templateData: {
			eleventyNavigation: {
				key: "Feed",
				order: 4
			}
		},
		collection: {
			name: "posts",
			limit: 10,
		},
		metadata: {
			language: "en",
			title: "Blog Title",
			subtitle: "This is a longer description about your blog.",
			base: "https://example.com/",
			author: {
				name: "Your Name"
			}
		}
	});

	eleventyConfig.addPlugin(pluginFilters);
	eleventyConfig.addPlugin(IdAttributePlugin, {
		checkDuplicates: false
	});

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return (new Date()).toISOString();
	});
};

export const config = {
	templateFormats: [
		"md",
		"njk",
		"html",
		"liquid",
		"11ty.js",
	],

	markdownTemplateEngine: "njk",
	htmlTemplateEngine: "njk",
	dir: {
		input: "content",
		includes: "../_includes",
		data: "../_data",
		output: "_site"
	},


};

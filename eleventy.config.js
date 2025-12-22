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
import htmlmin from "html-minifier-terser";
import CleanCSS from "clean-css";
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
		.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");
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

eleventyConfig.addTransform("htmlmin", async function (content) {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && this.page.outputPath && this.page.outputPath.endsWith(".html")) {
    try {
      const minified = await htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        // --- SETTING PALING AMAN ---
        minifyCSS: false,        // Jangan ganggu CSS karena banyak SVG panjang
        minifyJS: false,         // Jangan ganggu JS agar tidak error di tengah
        ignoreCustomFragments: [ /<script.*>[\s\S]*?<\/script>/ ], // Abaikan script
        decodeEntities: true,
        processConditionalComments: true
      });
      return minified;
    } catch (err) {
      // JIKA ERROR, ELEVENTY AKAN MENGEMBALIKAN KODE ASLI (TIDAK TERPOTONG)
      console.error("Minifier Failed:", err);
      return content; 
    }
  }
  return content;
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

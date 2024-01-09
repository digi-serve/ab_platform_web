/*
 * tinyMce
 *
 * Create a custom webix component.
 *
 * Note: This component is lazy loaded and requires calling .init() before using
 */
import ABLazyCustomComponent from "./lazyComponent.js";
export default class ABCustomTinyMCE extends ABLazyCustomComponent {
   get key() {
      return "tinymce-editor";
   }

   async init() {
      if (this.initialized) return;

      await import(
         /* webpackChunkName: "tiny" */
         /* webpackPrefetch: true */
         "../js/webix/extras/tinymce.js"
      );
      this.initialized = true;
   }
}

import ABUIPlugin from "./plugins/ABUIPlugin.js";
import ABPropertiesObjectPlugin from "./plugins/ABPropertiesObjectPlugin";
import ABObjectPlugin from "./plugins/ABObjectPlugin.js";
import ABModelPlugin from "./plugins/ABModelPlugin.js";

const classRegistry = {
   ObjectTypes: new Map(),
   ObjectPropertiesTypes: new Map(),
   FieldTypes: new Map(),
   ViewTypes: new Map(),
};

export function getPluginAPI() {
   return {
      ABUIPlugin,
      ABPropertiesObjectPlugin,
      ABObjectPlugin,
      ABModelPlugin,
      //  ABFieldPlugin,
      //  ABViewPlugin,
      registerObjectPropertiesTypes: (name, ctor) =>
         classRegistry.ObjectPropertiesTypes.set(name, ctor),
      registerObjectTypes: (name, ctor) =>
         classRegistry.ObjectTypes.set(name, ctor),
      // registerObjectPropertyType: (name, ctor) => classRegistry.ObjectPropertiesTypes.set(name, ctor),
      //  registerFieldType: (name, ctor) => classRegistry.FieldTypes.set(name, ctor),
      //  registerViewType: (name, ctor) => classRegistry.ViewTypes.set(name, ctor),
   };
}

// export function createField(type, config) {
//   const FieldClass = classRegistry.FieldTypes.get(type);
//   if (!FieldClass) throw new Error(`Unknown object type: ${type}`);
//   return new FieldClass(config);
// }
export function createObject(key, config, AB) {
   const ObjectClass = classRegistry.ObjectTypes.get(key);
   if (!ObjectClass) throw new Error(`Unknown object type: ${key}`);
   return new ObjectClass(config, AB);
}

export function createPropertiesObject(key, config, AB) {
   const ObjectClass = classRegistry.ObjectPropertiesTypes.get(key);
   if (!ObjectClass) throw new Error(`Unknown object type: ${key}`);
   return new ObjectClass(config, AB);
}

export function allObjectProperties() {
   return Array.from(classRegistry.ObjectPropertiesTypes.values());
}

// export function createObjectProperty(key, config) {
//    const ObjectClass = classRegistry.ObjectPropertiesTypes.get(key);
//    if (!ObjectClass) throw new Error(`Unknown object type: ${key}`);
//    return new ObjectClass(config);
//  }

// export function createView(type, config) {
//   const ViewClass = classRegistry.ViewTypes.get(type);
//   if (!ViewClass) throw new Error(`Unknown object type: ${type}`);
//   return new ViewClass(config);
// }

///
/// For development
///
import propertyNSAPI from "./plugins/developer/ABPropertiesObjectNetsuiteAPI.js";
import objectNSAPI from "./plugins/developer/ABObjectNetsuiteAPI.js";

export function registerLocalPlugins(API) {
   let { registerObjectTypes, registerObjectPropertiesTypes } = API;

   let cPropertyNSAPI = propertyNSAPI(API);
   registerObjectPropertiesTypes(cPropertyNSAPI.getPluginKey(), cPropertyNSAPI);

   let cObjectNSAPI = objectNSAPI(API);
   registerObjectTypes(cObjectNSAPI.getPluginKey(), cObjectNSAPI);
}

// module.exports = {
//    getPluginAPI,
//    createPropertiesObject,
//    // createField,
//    // createObjectProperty,
//    // createView,
//    // classRegistry, // Expose the registry for testing or introspection
//    registerLocalPlugins,
// };

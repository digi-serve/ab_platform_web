export default function webixElement(id) {
   return {
      id: id,
      adjust: () => {},
      attachEvent: () => {},
      blockEvent: () => {},
      clear: () => {},
      clearAll: () => {},
      clearValidation: () => {},
      define: () => {},
      disable: () => {},
      enable: () => {},
      filter: () => {},
      getParentView: () => {
         return new webixElement();
      },
      getPopup: () => {
         return new webixElement();
      },
      getSelectedItem: () => {},
      getValue: () => {},
      getValues: () => {},
      hide: () => {},
      hideProgress: () => {},
      parse: () => {},
      refresh: () => {},
      setValue: () => {},
      setValues: () => {},
      show: () => {},
      showProgress: () => {},
      unblockEvent: () => {},
      validate: () => {},
   };
}

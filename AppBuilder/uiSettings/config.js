/**
 * @class config
 *
 * Manage our configuration settings.
 */

import ConfigDesktop from "./configDesktop";
import ConfigMobile from "./configMobile";
import Icons from "./icons";

export default {
   config: function () {
      // TODO: decide which config file to return here:
      if (window.innerWidth < 768) {
         return ConfigMobile;
      }
      return ConfigDesktop;
   },
   icons: Icons.icons,
};

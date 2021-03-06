"use strict";
const window = {};

// Read configs from global variable if available, otherwise use the process.env injected from build.
const configs = {};
let isAdmin = true;
[
  "RETICULUM_SERVER",
  "THUMBNAIL_SERVER",
  "CORS_PROXY_SERVER",
  "NON_CORS_PROXY_DOMAINS",
  "SENTRY_DSN",
  "GA_TRACKING_ID",
  "SHORTLINK_DOMAIN",
  "BASE_ASSETS_PATH",
].forEach((x) => {
  let el; //document.querySelector(`meta[name='env:${x.toLowerCase()}']`);
  configs[x] = el ? el.getAttribute("content") : process.env[x];

  if (x === "BASE_ASSETS_PATH" && configs[x]) {
    // eslint-disable-next-line no-undef
    __webpack_public_path__ = configs[x];

    // Using external CDN to reduce build size
    pdfjs.GlobalWorkerOptions.workerSrc = `${configs[x]}../assets/js/pdfjs-dist@2.1.266/build/pdf.worker.js`;
  }
});
// Also include configs that reticulum injects as a script in the page head.

configs.AVAILABLE_INTEGRATIONS = window.AVAILABLE_INTEGRATIONS || {};

if (process.env.APP_CONFIG) {
  window.APP_CONFIG = process.env.APP_CONFIG;
}

if (window.APP_CONFIG) {
  configs.APP_CONFIG = window.APP_CONFIG;
  const { theme } = configs.APP_CONFIG;
  if (theme) {
    const colorVars = [];
    for (const key in theme) {
      if (!theme.hasOwnProperty(key)) continue;
      colorVars.push(`--${key}: ${theme[key]};`);
    }
    const style = document.createElement("style");
    style.innerHTML = `:root{${colorVars.join("\n")}}`;
    document.head.prepend(style);
  }

  if (!configs.APP_CONFIG.features) {
    configs.APP_CONFIG.features = {};
  }
} else {
  configs.APP_CONFIG = {
    features: {},
  };
}

const isLocalDevelopment = process.env.NODE_ENV === "development";

configs.feature = (featureName) => {
  const value =
    configs.APP_CONFIG &&
    configs.APP_CONFIG.features &&
    configs.APP_CONFIG.features[featureName];
  if (typeof value === "boolean" || featureName === "enable_spoke") {
    const forceEnableSpoke = featureName === "enable_spoke" && isAdmin;
    return forceEnableSpoke || value;
  } else {
    return value;
  }
};

let localDevImages = {};
if (isLocalDevelopment) {
  localDevImages = {
    logo: "",
    company_logo: "",
    editor_logo: "",
    home_background: "",
  };
}

configs.image = (imageName, cssUrl) => {
  const url =
    (configs.APP_CONFIG &&
      configs.APP_CONFIG.images &&
      configs.APP_CONFIG.images[imageName]) ||
    localDevImages[imageName];
  return url && cssUrl ? `url(${url})` : url;
};

configs.link = (linkName, defaultValue) => {
  return (
    (configs.APP_CONFIG &&
      configs.APP_CONFIG.links &&
      configs.APP_CONFIG.links[linkName]) ||
    defaultValue
  );
};

configs.setIsAdmin = (_isAdmin) => {
  isAdmin = _isAdmin;
};
configs.isAdmin = () => isAdmin;

module.exports = configs;

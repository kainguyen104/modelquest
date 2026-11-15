/* ================= boot ================= */
$("#logo").outerHTML=LOGO.replace('<svg','<svg width="40" height="40"');
hydrateIcons(document);
applyRole();
route();
cloudInit();

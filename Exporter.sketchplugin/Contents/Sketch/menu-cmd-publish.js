@import("exporter/publisher.js")

var onRun = function(context) {  

  UIDialog.setUp(context);

  const publisher = new Publisher(context,context.document);
  publisher.publish();

};
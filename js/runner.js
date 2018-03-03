app = null;

(function(){
  // var app;
  
  var color_crawler_options = {
    width: 800,
    height: 600,

    cycles_to_change_color: 100,
    color_amplitude: 10,
    
    // grow_type: 1,
    // cycles_to_change_grow_type: 100000,
    default_color: [255, 215, 55]
  };

  app = new ColorCrawlerApp(color_crawler_options);
}());
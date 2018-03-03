/**
 * Класс для работы с разными кнопками 
 */
class ColorCrawlerApp {
  constructor(options) {
    if(typeof options === "undefined") {
      options = {};
    }

    this.waiting = false;

    this.run_button = document.querySelector(".controls__button--run");
    this.run_button.addEventListener("click", this.run.bind(this));

    this.body = document.querySelector("body");

    this.color_crawler = new ColorCrawler(options);
  };
  
  /**
   * Запускает рисовалку
   * @returns {undefined}
   */
  run() {
    var __this = this;
    
    this.setWaiting(true);
    
    setTimeout(function(){
      __this.color_crawler.run();
      
      __this.setWaiting(false);
    }, 200);
  };
  
  setWaiting(state) {
    state = !!state;
    
    this.waiting = state;
    
    this.body.classList[this.waiting ? "add" : "remove"]("body--waiting");
  };
};
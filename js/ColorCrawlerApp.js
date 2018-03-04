/**
 * Класс для работы с разными кнопками 
 */
class ColorCrawlerApp {
  constructor() {
    // происходит ли ожидание
    this.waiting = false;
    
    // открыты ли настройки
    this.options_open = false;

    // кнопка запуска
    this.run_button = document.querySelector(".controls__button--run");
    this.run_button.addEventListener("click", this.run.bind(this));
    
    // кнопка вызова настроек
    this.options_button = document.querySelector(".controls__button--options");
    this.options_button.addEventListener("click", this.openOptions.bind(this, true));
    
    this.defaults_button = document.querySelector(".options__defaults");
    this.defaults_button.addEventListener("click", this.setDefaults.bind(this));
    
    // кнопка закрытия настроек
    this.options_close_button = document.querySelector(".options__close");
    this.options_close_button.addEventListener("click", this.openOptions.bind(this, false));

    this.body = document.querySelector("body");
    
    // названия возможных настроек
    this.options_names = [
      "width",
      "height",
      
      "default_r",
      "default_g",
      "default_b",
      
      "cycles_to_change_color",
      "color_amplitude",
    ];

    // настройки по умолчанию
    this.default_options = {
      width: 800,
      height: 600,
      
      default_r: 70,
      default_g: 180,
      default_b: 230,
      
      cycles_to_change_color: 10,
      color_amplitude: 3,
    };
    
    // получаем настройки из localStorage или из умолчаний
    this.getOptions();
    
    this.checkOptionsOpen();
    
    this.setInputsChange();
  };
  
  /**
   * Запускает рисовалку
   * @returns {undefined}
   */
  run() {
    // экземпляр алгоритма
    this.color_crawler = new ColorCrawler(this.options);

    var __this = this;
    
    this.setWaiting(true);
    
    setTimeout(function(){
      __this.color_crawler.run();
      
      __this.setWaiting(false);
    }, 200);
  };
  
  
  /**
   * Проверяет, открыто ли было окошко настроек
   * @returns {undefined}
   */
  checkOptionsOpen() {
    if(typeof localStorage !== "undefined") {
      if(typeof localStorage.options_open !== "undefined") {
        this.openOptions(localStorage.options_open);
      }
    }
  }
  
  /**
   * Устанавливает событие change для инпутов с настройками
   * @returns {undefined}
   */
  setInputsChange() {
    var inputs = document.querySelectorAll(".options__input");
    
    for(var i=0;i<inputs.length;i++) {
      var input = inputs[i];
      input.app = this;
      input.addEventListener("change", this.onOptionChange);
    }
  }
  
  /**
   * Устанавливает настройки по умолчанию
   * @returns {undefined}
   */
  setDefaults() {
    for(var option_key in this.options_names) {
      var option_name = this.options_names[option_key];
      var default_value = this.default_options[option_name];
      this.options[option_name] = default_value;
      
      document.getElementById("option_" + option_name).value = default_value;
      
      if(typeof localStorage !== "undefined") {
        if(typeof localStorage[option_name] !== "undefined") {
          localStorage.removeItem(option_name);
        }
      }
    }
  }
  
  /**
   * Событие при изменении инпута
   * @returns {undefined}
   */
  onOptionChange() {
    var input_value = this.value;
    var input_option_name = this.getAttribute("id").replace(/^option_/, "");
    var corrected_input = this.app.correntOption(input_option_name, input_value);
    if(corrected_input !== false) {
      if(corrected_input !== input_value) {
        this.value = corrected_input;
      }
    } else {
      this.value = this.app.default_options[input_option_name];
    }
    
    this.app.options[input_option_name] = this.value;

    if(typeof localStorage !== "undefined") {
      localStorage.setItem(input_option_name, this.value);
    }
  }
  
  
  /**
   * Открывает настройки алгоритма
   * @param {boolean} state 
   * true: открыть
   * false: закрыть
   * @returns {undefined}
   */
  openOptions(state) {
    state = !!state;
    
    this.options_open = state;
    
    if(typeof localStorage !== "undefined") {
      localStorage.setItem("options_open", state);
    }
    
    this.body.classList[this.options_open ? "add" : "remove"]("body--options");
  }
  
  
  /**
   * Получает первоначальные настройки
   * @returns {undefined}
   */
  getOptions() {
    var options_to_set = {};
    
    for(var options_key in this.options_names) {
      var option_name = this.options_names[options_key];
      if(typeof localStorage !== "undefined") {
        if(typeof localStorage[option_name] !== "undefined") {
          var option_value = localStorage[option_name];
          var corrected_result = this.correntOption(option_name, option_value);
          if(corrected_result !== false) {
            options_to_set[option_name] = corrected_result;
          }
        }
      }
      
      if(typeof options_to_set[option_name] === "undefined") {
        options_to_set[option_name] = this.default_options[option_name];
      }
      
      document.getElementById("option_" + option_name).value = options_to_set[option_name];
    }
    
    this.options = options_to_set;
  };
  
  
  correntOption(option_name, option_value) {
    if(option_name === "width" || option_name === "height" || option_name === "steps_to_change_color") {
      if(option_value.match(/\d+/)) {
        option_value = option_value.replace(/\D/g, "");
        option_value = parseInt(option_value);

        if(option_value < 1) {
          return false;
        } 
      } else {
        return false;
      }
    }
    
    if(option_name.match(/^(color_amplitude|default_[rgb])$/)) {
      if(option_value.match(/\d+/)) {
        option_value = option_value.replace(/\D/g, "");
        option_value = parseInt(option_value);
        
        if(option_value < 1) {
          return 1;
        }
        if(option_value > 255) {
          return 255;
        }
      } else {
        return 1 + Math.floor(Math.random() * 254);
      }
    }
    
    return option_value;
  }
  
  
  /**
   * Устанавливает состояние ожидания
   * @param {boolean} state
   * @returns {undefined}
   */
  setWaiting(state) {
    state = !!state;
    
    this.waiting = state;
    
    this.body.classList[this.waiting ? "add" : "remove"]("body--waiting");
  };
};
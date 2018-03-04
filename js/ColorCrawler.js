/**
 * Класс цветовой ползалки
 * @type type 
 */
class ColorCrawler {
  constructor(options) {
    this.width = options.width || 800;
    this.height = options.height || 600;
    
    this.options = options;
    
    // общее число точек канваса
    this.overall_points = this.width * this.height;
    
    // получаем элемент канваса и его контекст
    this.canvas = document.getElementById("canvas");
    this.context = this.canvas.getContext("2d");
    
    // устанавливаем размеры канваса
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    this.filled_indexes = {};
    this.border_points_array = {};
    
    this.imageData = null;
    this.image_data_points = null;
    
    this.start_point = options.start_point || "center";
    this.start_point_coords = null;
    
    this.current_cycle = 0;
    
    // this.max_cycle = this.overall_points;
    this.max_cycle = null;
    
    // точка, отдающая цвет
    this.donor_index = null;
    
    // точка, получающая цвет
    this.recipient_index = null;
    
    // раз во сколько шагов менять цвет
    this.cycles_to_change_color = options.cycles_to_change_color || 100;
    // на какое значение менять компоненты цвета при смене цвета
    this.color_amplitude = options.color_amplitude || 3;
    
    // какой цвет использовать для первой точки
    this.default_color = [
      options.default_r || 70, 
      options.default_g || 180, 
      options.default_b || 230
    ];
    
    console.log(this.default_color);
    
    // цвет, который будет установлен или который будет преобразовываться
    this.color = null;
    
    /**
     * Координаты соседних точек
     */
    this.neighbors_coords = [
      [-1,-1], [0,-1], [1,-1],
      [-1, 0],         [1, 0],
      [-1, 1], [0, 1], [1, 1]
    ];
    this.neighbors_coords_count = this.neighbors_coords.length;
    
    // 0: for
    // 1: setTimeout
    // 2: click event
    this.iteration_type = 0;
    
    this.iteration_initilized = false;
    
    this.iteration_interval = null;
    
    this.emergency_counter = 0;
    this.emergency_limit = 20000;
    
    // тип роста
    // 0 - случайный выбор краевой точки
    // 1 - цепочка (рост из последней поставленной краевой точки)
    this.grow_type = options.grow_type || 0;
    
    // раз в какое количество шагов менять тип роста
    this.cycles_to_change_grow_type = options.cycles_to_change_grow_type || 0;
    
    // раз
    this.cycles_to_change_growpoint = 0;
    
    this.start_time = null;
    this.end_time = null;
  }
  
  /**
   * Готовит объект к новому запуску
   * @returns {undefined}
   */
  prepare() {
    this.filled_indexes = {};
    for(var i=0;i<this.overall_points;i++) {
      this.filled_indexes[i] = false;
    }
    this.edge_indexes = [];
    this.edges_count = 0;
    
    this.context.clearRect(0, 0, this.width, this.height);
    this.imageData = this.context.getImageData(0, 0, this.width, this.height);
    this.image_data_points = this.imageData.data;
    
    this.current_cycle = 0;
    
    // передаю компоненты цвета по отдельности, т.к. иначе default_color 
    // меняется вместе с color
    this.color = [];
    this.color[0] = this.default_color[0];
    this.color[1] = this.default_color[1];
    this.color[2] = this.default_color[2];

    this.donor_index = null;
    this.recipient_index = null;
    
    if(this.max_cycle === null) {
      this.max_cycle = this.overall_points;
    }
    
    if(this.max_cycle > this.overall_points) {
      this.max_cycle = this.overall_points;
    }
    
    clearInterval(this.iteration_interval);
    
    this.start_time = new Date().getTime();
  }
  
  /**
   * Запускает рисование
   * @returns {undefined}
   */
  run() {
    this.prepare();
    
    this.setStartPoint();
    
    this.startCycling();
  }
  
  
  /**
   * Начинает цикл в зависимости от выбранного типа итерирования
   * @returns {undefined}
   */
  startCycling() {
    if(this.iteration_type === 0) {
      for(this.current_cycle=0;this.current_cycle<this.max_cycle;this.current_cycle++) {
        this.iterate();
      }
      this.finish();
    }
    
    if(this.iteration_type === 1) {
      this.iteration_interval = setInterval(this.iterate.bind(this), 20);
    }

    if(!this.iteration_initilized) {
      if(this.iteration_type === 2) {
        document.addEventListener("click", this.iterate.bind(this));
      }
      
      this.iteration_initilized = true;
    }
  };
  
  
  /**
   * Шаг итерации
   * @returns {undefined}
   */
  iterate() {
    if(this.current_cycle >= this.max_cycle) {
      this.finish();
      return;
    }
    this.emergency_counter = 0;
    
    this.checkChangeGrowType();

    var neighbors_count = 0;
    var set_donor_as_deadend = false;
    do {
      this.emergency_counter++;
      
      if(this.emergency_counter >= this.emergency_limit) {
        console.log("cycle/max", this.current_cycle, this.max_cycle)
        this.emergencyQuit();
        return;
      }
      
      this.getEdgePoint();
      
      var neighbors = this.findTwoNeighbors(this.donor_index);
      neighbors_count = neighbors.length;
      if(neighbors_count > 0) {
        if(neighbors_count === 1) {
          set_donor_as_deadend = true;
        }
        this.getColorFromDonor();
        this.recipient_index = neighbors[0];
        break;
      } else {
        this.removeDonorFromEdge();
      }
    } while (true);
    
    if(set_donor_as_deadend) {
      this.removeDonorFromEdge();
      /*
      if(this.grow_type === 0) {
        this.removeFirstFromEdge();
      }
      if(this.grow_type === 1) {
        this.removeLastFromEdge();
        this.shuffleLastElement();
      } */
    }

    this.checkColor();
    this.fillPoint();
    
    if(this.findAnyNeighbors(this.recipient_index)) {
      this.setIndexAsEdge(this.recipient_index);
    }
    
    if(this.iteration_type === 1 || this.iteration_type === 2) {
      this.current_cycle++;
      
      this.context.fillStyle = "rgba(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + ",1)";
      var recipient_coords = this.indexToCoords(this.recipient_index);
      this.context.fillRect(recipient_coords[0], recipient_coords[1], 1, 1);
    }
    
    if(this.current_cycle >= this.max_cycle) {
      this.finish();
    }
  }
  
  emergencyQuit() {
    console.log("EMERGENCY QUIT");
    
    this.finish();
  }
  
  /**
   * Сообщает, что закончил и рисует изображение
   * @returns {undefined}
   */
  finish() {
    this.current_cycle = this.max_cycle;
    
    clearInterval(this.iteration_interval);
    
    this.end_time = new Date().getTime();
    var overall_time = (this.end_time - this.start_time) / 1000;
    
    console.log("finished at cycle " + this.current_cycle + " in " + overall_time + " seconds");
    
    this.context.putImageData(this.imageData, 0, 0);
  }
  
  /**
   * Устанавливает начальную точку роста
   */
  setStartPoint() {
    // если задана конкретная точка и она входит в допустимые размеры,
    // то используем её
    if(typeof this.start_point === "array") {
      if(typeof this.start_point[0] === "number" 
          && this.start_point[0] >= 0 
          && this.start_point[0] < this.width
          && typeof this.start_point[1] === "number"
          && this.start_point[1] >= 0
          && this.start_point[1] < this.height)
      {
        this.start_point_coords = this.start_point;
        return;
      }
    }
    
    // точка со случайными координатами
    if(this.start_point === "random") {
      this.start_point_coords = [Math.floor(Math.random() * this.width), Math.floor(Math.random() * this.height)];
    }
    
    // ставим точку в центр
    this.start_point_coords = [Math.floor(this.width / 2), Math.floor(this.height / 2)];
    
    var start_point_index = this.coordsToIndex(this.start_point_coords)
    this.recipient_index = start_point_index;
    
    this.setIndexAsEdge(this.recipient_index);
    this.fillPoint();
    
    this.donor_index = this.recipient_index;
  }
  
  /**
   * Преобразует индекс точки в координаты
   * @param {number} index Индекс, который нужно преобразовать в координаты
   */
  indexToCoords(index) {
    var y = Math.floor(index / this.width);
    var x = index % this.width;
    return [x, y];
  }

  /**
   * Преобразует координаты точки в индекс, проверяя, допустимы ли такие 
   * координаты (= не выходят ли они за границу канваса)
   * @param {array} xy_array координаты точки, которую нужно преобразовать в индекс
   */
  coordsToIndex(xy_array) {
    if(xy_array[0] < 0
      || xy_array[0] >= this.width
      || xy_array[1] < 0
      || xy_array[1] >= this.height)
    {
      return false;
    }
    return this.width * xy_array[1] + xy_array[0];
  }
  
  /**
   * Находит случайную краевую точку
   * @returns {undefined}
   */
  getEdgePoint() {
    if(this.grow_type === 0) {
      this.getRandomEdgePoint();
    } else if(this.grow_type === 1) {
      this.getChainEdgePoint();
    }
  }
  
  /**
   * Получает случайную краевую точку
   * @returns {undefined}
   */
  getRandomEdgePoint() {
    this.shuffleFirstElement();

    this.donor_index = this.edge_indexes[0];
  }
  
  /**
   * Получает
   * @returns {undefined}
   */
  getChainEdgePoint() {
    // this.donor_index = this.edge_indexes.pop();
    this.donor_index = this.edge_indexes[this.edges_count - 1];
  }
  
  /**
   * Находит двух свободных соседей (чтобы принять решение, следует ли сразу
   * выкинуть точку из числа краевых)
   * @param {type} index
   * @returns {undefined}
   */
  findTwoNeighbors(index) {
    return this.findNeighbors(index, 2);
  }
  
  /**
   * Ищет хотя бы одного соседа
   * @param {number} index Индекс для поиска
   * @returns {undefined}
   */
  findAnyNeighbors(index) {
    return this.findNeighbors(index, 1);
  }
  
  /**
   * Ищет соседей точки
   * @param {number} index Индекс для поиска
   * @param {number} count Сколько искать соседей
   * @returns {undefined}
   */
  findNeighbors(index, count) {
    if(typeof index === "undefined") {
      index = this.donor_index;
    }
    if(typeof count === "undefined") {
      count = 1;
    }
    var coords = this.indexToCoords(index);
    var random_start = Math.floor(Math.random() * this.neighbors_coords_count);
    var coords_index = random_start;
    var found_neighbors = [];
    for(var i=0;i<this.neighbors_coords_count;i++) {
      if(coords_index >= this.neighbors_coords_count) {
        coords_index = 0;
      }
      
      var coords_modifiers = this.neighbors_coords[coords_index];
      var new_coords = [coords[0] + coords_modifiers[0], coords[1] + coords_modifiers[1]];
      var new_index = this.coordsToIndex(new_coords);
      if(new_index !== false) {
        if(!this.filled_indexes[new_index]) {
          found_neighbors.push(new_index);
          if(found_neighbors.length >= count) {
            break;
          }
        }
      }
      
      coords_index++;
    }
    
    return found_neighbors;
  }

  
  /**
   * Устанавливает точку как краевую и ставит её в случайное место списка
   * @param {number} index индекс, который нужно пометить как краевой
   * @returns {undefined}
   */
  setIndexAsEdge(index) {
    this.edges_count++;
    if(typeof index === "undefined") {
      index = this.recipient_index;
    }
    this.edge_indexes.push(index);
  }
  
  /**
   * Выбирает, по какому принципу удалять донора в зависимости от типа роста
   * @returns {undefined}
   */
  removeDonorFromEdge() {
    if(this.grow_type === 0) {
      this.removeFirstFromEdge();
    }
    if(this.grow_type === 1) {
      this.removeLastFromEdge();
      this.shuffleLastElement();
    }
  }
  
  /**
   * Удаляет первый в списке краевой индекс
   * @returns {undefined}
   */
  removeFirstFromEdge() {
    this.edge_indexes.shift();
    this.edges_count--;
  }
  
  /**
   * Удаляет последний в списке краевой индекс
   * @returns {undefined}
   */
  removeLastFromEdge() {
    this.edge_indexes.pop();
    this.edges_count--;
  }
  
  /**
   * Меняет местами случайный элемент с первым
   * @returns {undefined}
   */
  shuffleFirstElement() {
    // var random_index = Math.floor(Math.random() * this.edges_count);
    var random_index = Math.floor(Math.random() * this.edges_count);
    var tmp = this.edge_indexes[random_index];
    this.edge_indexes[random_index] = this.edge_indexes[0];
    this.edge_indexes[0] = tmp;
  }
  
  /**
   * Меняет местами случайный элемент с последним
   * @returns {undefined}
   */
  shuffleLastElement() {
    var random_index = Math.floor(Math.random() * this.edges_count);
    var tmp = this.edge_indexes[random_index];
    this.edge_indexes[random_index] = this.edge_indexes[this.edges_count - 1];
    this.edge_indexes[this.edges_count - 1] = tmp;
  }
  
  /**
   * Проверяет, пришло ли время менять цвет точки
   * @returns {undefined}
   */
  checkColor() {
    if(this.current_cycle % this.cycles_to_change_color === 0) {
      this.changeColor();
    }
  }
  
  /**
   * 
   * @returns {undefined}
   */
  changeColor() {
    for(var i=0;i<3;i++) {
      this.color[i] += (Math.random() > .5 ? -1 : 1) * Math.round(Math.random() * this.color_amplitude);
      if(this.color[i] <= this.color_amplitude) {
        this.color[i] = this.color_amplitude;
      }
      if(this.color[i] >= 255 - this.color_amplitude) {
        this.color[i] = 255 - this.color_amplitude;
      }
    }
  }
  
  getColorFromDonor() {
    var image_data_index = this.donor_index * 4;
    this.color[0] = this.image_data_points[image_data_index];
    this.color[1] = this.image_data_points[image_data_index + 1];
    this.color[2] = this.image_data_points[image_data_index + 2];
  }
  
  /**
   * Заполнить текущую точку текущим цветом и пометить как заполненную
   * @returns {undefined}
   */
  fillPoint() {
    var image_data_index = this.recipient_index * 4;
    this.image_data_points[image_data_index] = this.color[0];
    this.image_data_points[image_data_index + 1] = this.color[1];
    this.image_data_points[image_data_index + 2] = this.color[2];
    this.image_data_points[image_data_index + 3] = 255;
    
    this.filled_indexes[this.recipient_index] = true;
  }
  
  /**
   * Проверяет, пришло ли время менять способ роста
   * @returns {undefined}
   */
  checkChangeGrowType() {
    if(this.cycles_to_change_grow_type === 0) {
      return;
    }

    if(this.current_cycle % this.cycles_to_change_grow_type === 0) {
      this.changeGrowType();
    }
  }
  
  
  /**
   * Изменяет способ роста на противоположный
   * @returns {undefined}
   */
  changeGrowType() {
    this.grow_type = (this.grow_type === 0) ? 1 : 0;
  }
  
}
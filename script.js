'use strict';

// prettier-ignore
// const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
//

//
class Workout {
  date = new Date();
  id = (Date.now() + ' ').slice(-10);
  clicks = 0;
  constructor(coords, dist, dur) {
    this.coords = coords;
    this.dist = dist;
    this.dur = dur;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks += 1;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, dist, dur, cad) {
    super(coords, dist, dur);
    this.cad = cad;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.dur / this.dist;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, dist, dur, ele) {
    super(coords, dist, dur);
    this.ele = ele;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.dist / (this.dur / 60);
  }
}
//////////////////

//app
class App {
  #workouts = [];
  #map;
  #mapEvent;
  zoomLevel = 12;
  constructor() {
    //user postiion
    this._getPos();
    //local storage
    this._getLocalStorage();
    //adding event listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevation.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  //get position from geolocation API
  _getPos() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function (x) {
        alert(`Allow Permission else i will steal your Rabbit`);
      }
    );
  }

  //load the damn map
  _loadMap(pos) {
    let { latitude, longitude } = pos.coords;
    let coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // console.log(this);
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(function (work) {
      this._renderWorkoutMarker(work);
    }, this);
  }

  //unhide the form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(function () {
      form.style.display = 'grid';
    }, 1000);
  }

  //toggle the elevation
  _toggleElevation() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //create new workout
  _newWorkout(e) {
    let validInputs = function (...inputs) {
      return inputs.every(function (el) {
        return Number.isFinite(el);
      });
    };
    let allPositive = function (...inputs) {
      return inputs.every(function (el) {
        return el > 0;
      });
    };
    e.preventDefault();
    //get data from form
    let type = inputType.value;
    let distance = +inputDistance.value;
    let duration = +inputDuration.value;
    let { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //running -> running obj

    if (type === 'running') {
      let cad = +inputCadence.value;

      //check data

      if (
        !validInputs(distance, duration, cad) ||
        !allPositive(distance, duration, cad)
      ) {
        return alert('only +ve numbers and need to fill all input fields');
      }
      workout = new Running([lat, lng], distance, duration, cad);
    }
    //cycling ->cycling object
    if (type === 'cycling') {
      let ele = +inputElevation.value;

      //check data

      if (
        !validInputs(distance, duration, ele) ||
        !allPositive(distance, duration)
      ) {
        return alert('only +ve numbers and need to fill all input fields');
      }
      workout = new Cycling([lat, lng], distance, duration, ele);
    }

    //add workout to array
    this.#workouts.push(workout);
    // console.log(workout);
    //render workout on map as marker
    this._renderWorkoutMarker(workout);
    //render workout on list
    this._renderWorkout(workout);
    //marker display
    //clear fields + hide form
    this._hideForm();
    //local storage
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    inputDistance.focus();
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          clasName: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    // console.log(workout.dist, workout.dur);
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type == 'running' ? '🏃‍♂️' : '🚴‍♂️'
          }</span>
          <span class="workout__value">${workout.dist}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.dur}</span>
          <span class="workout__unit">min</span>
        </div>`;
    if (workout.type == 'running') {
      html += `<div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cad}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    }
    if (workout.type == 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.ele}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    let workoutEL = e.target.closest('.workout');
    // console.log(workoutEL);
    if (!workoutEL) return;
    let workout = this.#workouts.find(function (ele) {
      return ele.id == workoutEL.dataset.id;
    });
    // console.log(workout);
    this.#map.setView(workout.coords, this.zoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    let data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(function (work) {
      this._renderWorkout(work);
    }, this);
  }
  // reset(){
  //   localStorage.removeItem('workouts');
  //   location.reload();
  // }
}
let app = new App();

//

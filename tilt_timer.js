// tilt_timer.js

class TiltTimer {
  constructor() {
    this.timerRunning = false;
    this.startTime = 0;
    this.totalTime = 0;
  }

  startStopTimer() {
    if (!this.timerRunning) {
      this.timerRunning = true;
      this.startTime = Date.now();
    } else {
      this.timerRunning = false;
      this.totalTime += Date.now() - this.startTime;
    }
  }

  stopTimer() {
    if (this.timerRunning) {
      this.timerRunning = false;
      this.totalTime += Date.now() - this.startTime;
    }
  }

  getTotalTime() {
    if (this.timerRunning) {
      return this.totalTime + (Date.now() - this.startTime);
    }
    return this.totalTime;
  }

  resetTimer() {
    this.timerRunning = false;
    this.startTime = 0;
    this.totalTime = 0;
  }
}

const timer1 = new TiltTimer();
const timer2 = new TiltTimer();

const timer1Label = document.getElementById('timer1');
const timer2Label = document.getElementById('timer2');
const percentageLabel = document.getElementById('percentage');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');
const enableButton = document.getElementById('enable');
const datetimeLabel = document.getElementById('datetime');
const dial1 = document.getElementById('dial1');
const dial2 = document.getElementById('dial2');
let tiltDetectionEnabled = false;

function updateDateTime() {
  const currentDatetime = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  datetimeLabel.textContent = currentDatetime;
  setTimeout(updateDateTime, 60000);
}

function updateTimerLabels() {
  const totalTime1 = timer1.getTotalTime() / 1000;
  const minutes1 = Math.floor(totalTime1 / 60);
  const seconds1 = Math.floor(totalTime1 % 60);
  const tenths1 = Math.floor((totalTime1 * 10) % 10);
  timer1Label.textContent = `${minutes1}:${seconds1.toString().padStart(2, '0')}.${tenths1}`;

  const totalTime2 = timer2.getTotalTime() / 1000;
  const minutes2 = Math.floor(totalTime2 / 60);
  const seconds2 = Math.floor(totalTime2 % 60);
  const tenths2 = Math.floor((totalTime2 * 10) % 10);
  timer2Label.textContent = `${minutes2}:${seconds2.toString().padStart(2, '0')}.${tenths2}`;

  const totalTime = totalTime1 + totalTime2;
  const percentage = totalTime > 0 ? (totalTime1 / totalTime) * 100 : 0;
  percentageLabel.textContent = `${percentage.toFixed(0)}%`;
}

function checkTilt(event) {
  if (!tiltDetectionEnabled) return;

  const { beta, gamma } = event; // beta is the front/back tilt in degrees, gamma is the left/right tilt in degrees
  const rightTiltThreshold = 45; // 左右に傾けた時の閾値
  const verticalThreshold = 10; // 垂直のときの閾値

  if (Math.abs(gamma) > rightTiltThreshold && Math.abs(beta - 90) > verticalThreshold) { // 左右に大きく傾いたとき、かつ垂直でないとき
    if (timer1.timerRunning) timer1.stopTimer();
    if (timer2.timerRunning) timer2.stopTimer();
    document.body.style.backgroundColor = 'white';
  } else if ((beta > 45 && beta < 135) || Math.abs(beta - 90) <= verticalThreshold) { // 画面が前に45度から135度の間に傾いたとき、または垂直に近いとき
    if (!timer2.timerRunning) {
      timer1.stopTimer(); // タイマー1を停止
      timer2.startStopTimer();
    }
    document.body.style.backgroundColor = '#ffcccc'; // 薄い赤背景
  } else if (beta >= -45 && beta <= 45) { // 画面が上向きのとき（プラスマイナス45度）
    if (!timer1.timerRunning) {
      timer2.stopTimer(); // タイマー2を停止
      timer1.startStopTimer();
    }
    document.body.style.backgroundColor = '#ccffcc'; // 薄い緑背景
  } else {
    timer1.stopTimer();
    timer2.stopTimer();
    document.body.style.backgroundColor = 'white';
  }

  updateTimerLabels();
}

function adjustValue(inputElement, adjustment) {
  const currentValue = parseInt(inputElement.value) || 0;
  inputElement.value = currentValue + adjustment;
}

document.getElementById('decreaseDial1').addEventListener('click', () => adjustValue(dial1, -1));
document.getElementById('increaseDial1').addEventListener('click', () => adjustValue(dial1, 1));
document.getElementById('decreaseDial2').addEventListener('click', () => adjustValue(dial2, -1));
document.getElementById('increaseDial2').addEventListener('click', () => adjustValue(dial2, 1));

startButton.addEventListener('click', () => {
  tiltDetectionEnabled = true;
  window.addEventListener('deviceorientation', checkTilt);
  startButton.disabled = true;
  resetButton.disabled = false;
});

resetButton.addEventListener('click', () => {
  if (resetButton.textContent === '終了') {
    tiltDetectionEnabled = false;
    window.removeEventListener('deviceorientation', checkTilt);
    timer1.resetTimer();
    timer2.resetTimer();
    startButton.disabled = true;
    resetButton.textContent = 'リセット';
    dial1.value = 11; // dial1の値をリセット
    dial2.value = 11; // dial2の値をリセット
    document.body.style.backgroundColor = 'white';
  } else {
    timer1.resetTimer();
    timer2.resetTimer();
    startButton.disabled = false;
    resetButton.disabled = true;
    resetButton.textContent = '終了';
    timer1Label.textContent = '0:00.0';
    timer2Label.textContent = '0:00.0';
    percentageLabel.textContent = '00%';
    dial1.value = 11; // dial1の値をリセット
    dial2.value = 11; // dial2の値をリセット
    document.body.style.backgroundColor = 'white';
  }
});

enableButton.addEventListener('click', () => {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().then(permissionState => {
      if (permissionState === 'granted') {
        enableButton.style.display = 'none';
        startButton.disabled = false; // センサー有効化後にスタートボタンを有効化
      }
    }).catch(console.error);
  } else {
    enableButton.style.display = 'none';
    startButton.disabled = false; // センサー有効化後にスタートボタンを有効化
  }
});

updateDateTime();

// スリープを防止するための設定
let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock was released');
    });
    console.log('Wake Lock is active');
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

// 定期的にスリープを防止する
setInterval(() => {
  if (!wakeLock) {
    requestWakeLock();
  }
}, 120000); // 2分ごとにスリープ防止を試みる

// 再読み込み確認ダイアログ
window.addEventListener('beforeunload', (event) => {
  event.preventDefault();
  event.returnValue = '';
});

// タイマーの状態をローカルストレージに保存する関数
function saveState() {
  const state = {
    timer1: {
      running: timer1.timerRunning,
      startTime: timer1.startTime,
      totalTime: timer1.totalTime
    },
    timer2: {
      running: timer2.timerRunning,
      startTime: timer2.startTime,
      totalTime: timer2.totalTime
    },
    dial1: dial1.value,
    dial2: dial2.value,
    tiltDetectionEnabled
  };
  localStorage.setItem('tiltTimerState', JSON.stringify(state));
}

// タイマーの状態をローカルストレージから復元する関数
function loadState() {
  const state = JSON.parse(localStorage.getItem('tiltTimerState'));
  if (state) {
    timer1.timerRunning = state.timer1.running;
    timer1.startTime = state.timer1.startTime;
    timer1.totalTime = state.timer1.totalTime;

    timer2.timerRunning = state.timer2.running;
    timer2.startTime = state.timer2.startTime;
    timer2.totalTime = state.timer2.totalTime;

    dial1.value = state.dial1;
    dial2.value = state.dial2;
    tiltDetectionEnabled = state.tiltDetectionEnabled;

    if (tiltDetectionEnabled) {
      startButton.disabled = true;
      resetButton.disabled = false;
      window.addEventListener('deviceorientation', checkTilt);
    }
    updateTimerLabels();
  }
}

// ページが閉じられる前に状態を保存する
window.addEventListener('beforeunload', saveState);

// ページ読み込み時に状態を復元する
window.addEventListener('load', loadState);

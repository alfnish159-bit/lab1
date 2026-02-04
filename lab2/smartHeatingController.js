// smartHeatingController.js
const ABS_ZERO = -273.15;

function getThreshold(mode) {
  if (mode === 'Эко') return 3;
  if (mode === 'Комфорт') return 0.5;
  throw new Error('Неизвестный режим');
}

/**
 * Контроллер отопления:
 * - берёт текущую температуру из SensorService (async)
 * - решает включать котёл или нет
 * - если датчик вернул null/undefined/нечисло/темп ниже ABS_ZERO -> это safety-ошибка => котёл ВЫКЛ
 *
 * sensorService: { getCurrentTemperature: async () => number|null|undefined }
 * logger: { error: fn } (можно мокать)
 */
async function shouldTurnOnBoilerFromSensor(targetTemp, mode, sensorService, logger = console) {
  if (typeof targetTemp !== 'number') throw new Error('Целевая температура должна быть числом');
  if (targetTemp < ABS_ZERO) throw new Error('Температура ниже абсолютного нуля');
  if (!sensorService || typeof sensorService.getCurrentTemperature !== 'function') {
    throw new Error('SensorService не предоставлен или некорректный');
  }

  const currentTemp = await sensorService.getCurrentTemperature();

  // Safety: датчик не дал валидные данные => выключаем котёл
  const invalid =
    currentTemp === null ||
    currentTemp === undefined ||
    typeof currentTemp !== 'number' ||
    currentTemp < ABS_ZERO;

  if (invalid) {
    logger.error?.('SAFETY: invalid sensor temperature', { currentTemp });
    return false;
  }

  const threshold = getThreshold(mode);
  return currentTemp <= targetTemp - threshold;
}

module.exports = { shouldTurnOnBoilerFromSensor, ABS_ZERO, getThreshold };
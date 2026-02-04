// smartHeatingController.test.js
const { shouldTurnOnBoilerFromSensor, ABS_ZERO } = require('./smartHeatingController');

describe('Smart Heating Controller (variant 6)', () => {
  test('Эко: включает, если ниже цели на 3 и больше (температура из датчика async)', async () => {
    const sensorService = { getCurrentTemperature: jest.fn().mockResolvedValue(17) }; // STUB
    const logger = { error: jest.fn() }; // MOCK

    await expect(shouldTurnOnBoilerFromSensor(20, 'Эко', sensorService, logger)).resolves.toBe(true);
    expect(sensorService.getCurrentTemperature).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('Комфорт: включает, если ниже цели на 0.5 и больше', async () => {
    const sensorService = { getCurrentTemperature: jest.fn().mockResolvedValue(19.5) };
    const logger = { error: jest.fn() };

    const res = await shouldTurnOnBoilerFromSensor(20, 'Комфорт', sensorService, logger);
    expect(res).toBe(true);
  });

  test('Не включает, если текущая равна целевой', async () => {
    const sensorService = { getCurrentTemperature: jest.fn().mockResolvedValue(20) };
    const logger = { error: jest.fn() };

    const eco = await shouldTurnOnBoilerFromSensor(20, 'Эко', sensorService, logger);
    const comfort = await shouldTurnOnBoilerFromSensor(20, 'Комфорт', sensorService, logger);

    expect(eco).toBe(false);
    expect(comfort).toBe(false);
  });

  test('Safety: датчик вернул null => котёл выключить + логгер вызван', async () => {
    const sensorService = { getCurrentTemperature: jest.fn().mockResolvedValue(null) };
    const logger = { error: jest.fn() };

    const res = await shouldTurnOnBoilerFromSensor(20, 'Эко', sensorService, logger);
    expect(res).toBe(false);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  test('Safety: датчик вернул undefined => котёл выключить + логгер вызван', async () => {
    const sensorService = { getCurrentTemperature: jest.fn().mockResolvedValue(undefined) };
    const logger = { error: jest.fn() };

    const res = await shouldTurnOnBoilerFromSensor(20, 'Эко', sensorService, logger);
    expect(res).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  test('Safety: датчик вернул температуру ниже ABS_ZERO => котёл выключить', async () => {
    const sensorService = { getCurrentTemperature: jest.fn().mockResolvedValue(ABS_ZERO - 1) };
    const logger = { error: jest.fn() };

    const res = await shouldTurnOnBoilerFromSensor(20, 'Комфорт', sensorService, logger);
    expect(res).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  test('Ошибка: неизвестный режим', async () => {
    const sensorService = { getCurrentTemperature: jest.fn().mockResolvedValue(10) };
    await expect(shouldTurnOnBoilerFromSensor(20, 'Turbo', sensorService)).rejects.toThrow('Неизвестный режим');
  });

  test('Ошибка: целевая температура ниже абсолютного нуля', async () => {
    const sensorService = { getCurrentTemperature: jest.fn().mockResolvedValue(10) };
    await expect(shouldTurnOnBoilerFromSensor(ABS_ZERO - 0.01, 'Эко', sensorService)).rejects.toThrow();
  });
});
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = '@life_sim_save_v5';

const C = {
  bg: '#090A0C',
  surface: '#111318',
  surface2: '#171A20',
  surface3: '#1D2128',
  border: '#252932',
  text: '#F3F4F6',
  sub: '#989EA8',
  muted: '#626873',
  green: '#70D49B',
  red: '#E77C83',
  yellow: '#E7BE69',
  blue: '#74AAEA',
  accent: '#8C91FF',
};

const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));
const money = (v) => Number(Math.round(v || 0)).toLocaleString('uk-UA');

const START = {
  version: 5,
  date: { day: 12, month: 8, year: 2026 },
  timeMinutes: 8 * 60,
  birthday: { day: 12, month: 8 },
  age: 18,
  alive: true,
  causeOfDeath: null,

  cash: 500,
  bank: 0,

  health: 94,
  energy: 86,
  fatigue: 12,
  satiety: 72,
  mood: 74,
  stress: 8,
  fitness: 42,

  intelligence: 8,
  charisma: 8,
  professionalSkill: 0,
  reputation: 2,

  hidden: {
    familyBond: 60,
    socialTrust: 50,
    careerTrust: 50,
    empathy: 50,
    reliability: 50,
    burnout: 0,
    longTermHealth: 92,
    loneliness: 10,
    lifeStress: 5,
  },

  jobId: null,
  workedToday: false,
  workDaysMonth: 0,
  yearsExperience: 0,
  careerMonths: 0,

  phoneId: 'samsung_s3',
  phoneCondition: 55,
  cars: [],
  activeCarId: null,
  housingId: 'parents',
  properties: [],
  businesses: [],
  investments: 0,

  monthly: {
    salary: 0,
    business: 0,
    investments: 0,
    housing: 0,
    food: 0,
    transport: 0,
    healthcare: 0,
    purchases: 0,
  },

  stats: {
    daysLived: 1,
    totalEarned: 0,
    totalSpent: 0,
    jobsHeld: 0,
    eventsSeen: 0,
    goodDeeds: 0,
    missedFamilyEvents: 0,
  },

  relatives: {
    mother: { name: 'Мама', alive: true, age: 43, relationship: 75, health: 88 },
    father: { name: 'Отец', alive: true, age: 45, relationship: 70, health: 84 },
    grandmother: { name: 'Бабушка', alive: true, age: 66, relationship: 66, health: 68 },
  },

  people: {
    coworker_anna: { name: 'Анна', relation: 0, trust: 0, alive: true },
    coworker_oleg: { name: 'Олег', relation: 0, trust: 0, alive: true },
    boss: { name: 'Руководитель', relation: 0, trust: 0, alive: true },
  },

  memories: [],
  pendingEventId: null,
  lastEventDay: -20,
  endedAt: null,
};

const JOBS = [
  {
    id: 'courier',
    company: 'Glovo',
    name: 'Курьер',
    salary: 19000,
    hours: 8,
    energy: 28,
    fatigue: 24,
    stress: 6,
    req: { intelligence: 0, charisma: 0, skill: 0, reputation: 0 },
  },
  {
    id: 'seller',
    company: 'COMFY',
    name: 'Продавец-консультант',
    salary: 26000,
    hours: 8,
    energy: 26,
    fatigue: 22,
    stress: 8,
    req: { intelligence: 8, charisma: 12, skill: 0, reputation: 0 },
  },
  {
    id: 'operator',
    company: 'Київстар',
    name: 'Оператор поддержки',
    salary: 33000,
    hours: 8,
    energy: 22,
    fatigue: 22,
    stress: 11,
    req: { intelligence: 14, charisma: 12, skill: 5, reputation: 2 },
  },
  {
    id: 'sales_manager',
    company: 'AUTO.RIA',
    name: 'Менеджер по продажам',
    salary: 52000,
    hours: 9,
    energy: 25,
    fatigue: 25,
    stress: 14,
    req: { intelligence: 18, charisma: 25, skill: 18, reputation: 8 },
  },
  {
    id: 'senior_manager',
    company: 'Rozetka',
    name: 'Старший менеджер',
    salary: 82000,
    hours: 9,
    energy: 27,
    fatigue: 27,
    stress: 17,
    req: { intelligence: 28, charisma: 34, skill: 35, reputation: 20 },
  },
  {
    id: 'director',
    company: 'Nova Group',
    name: 'Коммерческий директор',
    salary: 165000,
    hours: 10,
    energy: 30,
    fatigue: 31,
    stress: 24,
    req: { intelligence: 48, charisma: 52, skill: 65, reputation: 45 },
  },
];

const PHONES = [
  { id: 'nokia_6300', brand: 'Nokia', model: '6300', year: 2007, price: 900, performance: 5, camera: 2, prestige: 1, monthly: 80 },
  { id: 'samsung_s3', brand: 'Samsung', model: 'Galaxy S III', year: 2012, price: 1800, performance: 10, camera: 9, prestige: 2, monthly: 100 },
  { id: 'iphone_5', brand: 'Apple', model: 'iPhone 5', year: 2012, price: 2600, performance: 12, camera: 13, prestige: 4, monthly: 110 },
  { id: 'iphone_7', brand: 'Apple', model: 'iPhone 7', year: 2016, price: 5200, performance: 28, camera: 31, prestige: 10, monthly: 130 },
  { id: 'redmi_note_8', brand: 'Xiaomi', model: 'Redmi Note 8', year: 2019, price: 6500, performance: 35, camera: 38, prestige: 7, monthly: 130 },
  { id: 'iphone_11', brand: 'Apple', model: 'iPhone 11', year: 2019, price: 12500, performance: 55, camera: 61, prestige: 23, monthly: 170 },
  { id: 'galaxy_s22', brand: 'Samsung', model: 'Galaxy S22', year: 2022, price: 22000, performance: 72, camera: 76, prestige: 35, monthly: 190 },
  { id: 'iphone_13_pro', brand: 'Apple', model: 'iPhone 13 Pro', year: 2021, price: 28500, performance: 78, camera: 84, prestige: 46, monthly: 210 },
  { id: 'pixel_9_pro', brand: 'Google', model: 'Pixel 9 Pro', year: 2024, price: 44000, performance: 89, camera: 94, prestige: 55, monthly: 240 },
  { id: 'iphone_16_pro_max', brand: 'Apple', model: 'iPhone 16 Pro Max', year: 2024, price: 62000, performance: 96, camera: 96, prestige: 78, monthly: 260 },
  { id: 'galaxy_s25_ultra', brand: 'Samsung', model: 'Galaxy S25 Ultra', year: 2025, price: 68000, performance: 98, camera: 98, prestige: 80, monthly: 270 },
];

const CARS = [
  { id: 'lanos_2006', brand: 'Daewoo', model: 'Lanos', year: 2006, price: 90000, reliability: 52, comfort: 25, prestige: 3, monthly: 4500 },
  { id: 'sens_2010', brand: 'ЗАЗ', model: 'Sens', year: 2010, price: 110000, reliability: 55, comfort: 27, prestige: 3, monthly: 4300 },
  { id: 'logan_2012', brand: 'Renault', model: 'Logan', year: 2012, price: 210000, reliability: 78, comfort: 38, prestige: 7, monthly: 5200 },
  { id: 'golf_2013', brand: 'Volkswagen', model: 'Golf VII', year: 2013, price: 390000, reliability: 72, comfort: 52, prestige: 17, monthly: 6500 },
  { id: 'octavia_2017', brand: 'Skoda', model: 'Octavia', year: 2017, price: 610000, reliability: 80, comfort: 62, prestige: 22, monthly: 7200 },
  { id: 'camry_2019', brand: 'Toyota', model: 'Camry', year: 2019, price: 980000, reliability: 91, comfort: 74, prestige: 39, monthly: 8800 },
  { id: 'bmw_530d_2017', brand: 'BMW', model: '530d G30', year: 2017, price: 1250000, reliability: 72, comfort: 84, prestige: 58, monthly: 12500 },
  { id: 'mercedes_e220d_2020', brand: 'Mercedes-Benz', model: 'E 220 d', year: 2020, price: 1800000, reliability: 78, comfort: 89, prestige: 67, monthly: 14800 },
  { id: 'bmw_m5_2024', brand: 'BMW', model: 'M5', year: 2024, price: 6200000, reliability: 72, comfort: 91, prestige: 91, monthly: 36000 },
  { id: 'porsche_911_2025', brand: 'Porsche', model: '911 Carrera', year: 2025, price: 8500000, reliability: 86, comfort: 88, prestige: 96, monthly: 46000 },
  { id: 'bentley_continental', brand: 'Bentley', model: 'Continental GT', year: 2025, price: 14500000, reliability: 77, comfort: 98, prestige: 99, monthly: 78000 },
  { id: 'rolls_royce_ghost', brand: 'Rolls-Royce', model: 'Ghost', year: 2025, price: 23000000, reliability: 82, comfort: 100, prestige: 100, monthly: 115000 },
];

const HOUSING = [
  { id: 'parents', name: 'Жить с родителями', type: 'rent', price: 0, monthly: 2500, comfort: 35, healthBonus: 0, prestige: 0 },
  { id: 'room', name: 'Комната в квартире', type: 'rent', price: 0, monthly: 6500, comfort: 42, healthBonus: 0, prestige: 2 },
  { id: 'studio_rent', name: 'Студия в аренду', type: 'rent', price: 0, monthly: 14500, comfort: 60, healthBonus: 1, prestige: 7 },
  { id: 'flat_buy', name: '1-комнатная квартира', type: 'buy', price: 2200000, monthly: 3800, comfort: 69, healthBonus: 2, prestige: 14 },
  { id: 'flat_premium', name: 'Квартира бизнес-класса', type: 'buy', price: 5800000, monthly: 8500, comfort: 88, healthBonus: 3, prestige: 35 },
  { id: 'house', name: 'Загородный дом', type: 'buy', price: 11000000, monthly: 18000, comfort: 95, healthBonus: 4, prestige: 55 },
];

const BUSINESS_CATALOG = [
  { id: 'coffee_machine', name: 'Кофейный автомат', price: 65000, baseDaily: 340, expenses: 0.28 },
  { id: 'coffee_kiosk', name: 'Кофейный киоск', price: 260000, baseDaily: 1700, expenses: 0.46 },
  { id: 'car_wash', name: 'Автомойка', price: 950000, baseDaily: 6200, expenses: 0.55 },
  { id: 'cafe', name: 'Кофейня', price: 1650000, baseDaily: 10200, expenses: 0.62 },
  { id: 'service_station', name: 'СТО', price: 3200000, baseDaily: 20500, expenses: 0.61 },
  { id: 'restaurant', name: 'Ресторан', price: 6500000, baseDaily: 38000, expenses: 0.68 },
];

const EVENTS = {
  family_dinner: {
    id: 'family_dinner',
    title: 'Семейный ужин',
    text: 'Мама звонит и приглашает приехать вечером. Последнее время вы видитесь нечасто.',
    choices: [
      { label: 'Приехать на ужин', effect: { time: 180, mood: 8, energy: -8, familyBond: 6 }, memory: 'Приехал на семейный ужин' },
      { label: 'Сослаться на работу', effect: { familyBond: -3, reliability: -1 }, memory: 'Отказался от семейного ужина ради дел' },
      { label: 'Не отвечать', effect: { familyBond: -7, loneliness: 2 }, memory: 'Не ответил на звонок семьи' },
    ],
  },
  coworker_funeral: {
    id: 'coworker_funeral',
    title: 'Сбор на похороны коллеги',
    text: 'Умер сотрудник компании, который занимал должность выше вашей. Коллеги собирают деньги семье на похороны.',
    choices: [
      { label: 'Передать 2 000 ₴', cost: 2000, effect: { careerTrust: 5, empathy: 4, socialTrust: 3 }, memory: 'Помог со сбором на похороны коллеги' },
      { label: 'Передать 5 000 ₴', cost: 5000, effect: { careerTrust: 8, empathy: 7, socialTrust: 5 }, memory: 'Щедро помог семье умершего коллеги' },
      { label: 'Выразить соболезнования без денег', effect: { careerTrust: 0, empathy: 1 }, memory: 'Выразил соболезнования коллегам' },
      { label: 'Ничего не делать', effect: { careerTrust: -7, socialTrust: -5, empathy: -3 }, memory: 'Не участвовал в помощи семье умершего коллеги' },
    ],
  },
  friend_help: {
    id: 'friend_help',
    title: 'Просьба о помощи',
    text: 'Старый знакомый оказался в сложной ситуации и просит одолжить 10 000 ₴. Обещает вернуть позже.',
    choices: [
      { label: 'Одолжить 10 000 ₴', cost: 10000, effect: { socialTrust: 6, empathy: 5 }, memory: 'Одолжил деньги знакомому в трудной ситуации' },
      { label: 'Дать 3 000 ₴ без возврата', cost: 3000, effect: { socialTrust: 4, empathy: 7 }, memory: 'Безвозмездно помог знакомому' },
      { label: 'Отказать', effect: { empathy: -1 }, memory: 'Отказал знакомому в финансовой помощи' },
    ],
  },
  health_warning: {
    id: 'health_warning',
    title: 'Самочувствие ухудшилось',
    text: 'Последние дни вы быстро устаёте и хуже концентрируетесь. Возможно, стоит уделить внимание здоровью.',
    choices: [
      { label: 'Записаться к врачу — 1 500 ₴', cost: 1500, effect: { health: 4, stress: -4, longTermHealth: 2, time: 120 }, memory: 'Обратился к врачу при первых симптомах' },
      { label: 'Взять выходной', effect: { energy: 15, fatigue: -18, stress: -7, mood: 3 }, memory: 'Взял выходной из-за плохого самочувствия' },
      { label: 'Продолжить как обычно', effect: { health: -3, fatigue: 7, stress: 4, longTermHealth: -2 }, memory: 'Проигнорировал ухудшение здоровья' },
    ],
  },
  promotion_chance: {
    id: 'promotion_chance',
    title: 'Освободилась должность',
    text: 'В компании освободилась более высокая позиция. Руководство обсуждает кандидатов внутри коллектива.',
    choices: [
      { label: 'Поговорить с руководителем', effect: { stress: 3 }, memory: 'Проявил инициативу при открытии вакансии', special: 'promotion_try' },
      { label: 'Не вмешиваться', effect: {}, memory: 'Не стал претендовать на повышение' },
    ],
  },
};

function deepMerge(base, saved) {
  if (!saved) return base;
  const out = { ...base, ...saved };
  out.hidden = { ...base.hidden, ...(saved.hidden || {}) };
  out.monthly = { ...base.monthly, ...(saved.monthly || {}) };
  out.stats = { ...base.stats, ...(saved.stats || {}) };
  out.relatives = { ...base.relatives, ...(saved.relatives || {}) };
  out.people = { ...base.people, ...(saved.people || {}) };
  return out;
}

function formatTime(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatDate(date) {
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${date.day} ${months[date.month - 1]} ${date.year}`;
}

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function nextDate(date) {
  let { day, month, year } = date;
  day++;
  if (day > daysInMonth(month, year)) {
    day = 1;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return { day, month, year };
}

function getPhone(id) {
  return PHONES.find(x => x.id === id) || PHONES[0];
}

function getHousing(id) {
  return HOUSING.find(x => x.id === id) || HOUSING[0];
}

function getJob(id) {
  return JOBS.find(x => x.id === id) || null;
}

function Game() {
  const [game, setGame] = useState(START);
  const [screen, setScreen] = useState('home');
  const [marketTab, setMarketTab] = useState('phones');
  const [loaded, setLoaded] = useState(false);
  const [event, setEvent] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const restored = deepMerge(START, parsed);
          setGame(restored);
          if (restored.pendingEventId && EVENTS[restored.pendingEventId]) {
            setEvent(EVENTS[restored.pendingEventId]);
          }
        }
      } catch (e) {
        console.log('LOAD ERROR', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(game));
      } catch (e) {
        console.log('SAVE ERROR', e);
      }
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [game, loaded]);

  const currentJob = useMemo(() => getJob(game.jobId), [game.jobId]);
  const currentPhone = useMemo(() => getPhone(game.phoneId), [game.phoneId]);
  const currentHousing = useMemo(() => getHousing(game.housingId), [game.housingId]);

  const netWorth = useMemo(() => {
    const cars = game.cars.reduce((s, c) => {
      const base = CARS.find(x => x.id === c.catalogId);
      return s + (base ? base.price * (c.condition / 100) * 0.75 : 0);
    }, 0);
    const props = game.properties.reduce((s, p) => {
      const base = HOUSING.find(x => x.id === p.catalogId);
      return s + (base ? base.price : 0);
    }, 0);
    const biz = game.businesses.reduce((s, b) => {
      const base = BUSINESS_CATALOG.find(x => x.id === b.catalogId);
      return s + (base ? base.price : 0);
    }, 0);
    return Math.round(game.cash + game.bank + cars + props + biz + game.investments + currentPhone.price * game.phoneCondition / 100 * 0.3);
  }, [game, currentPhone]);

  const patch = (updater) => {
    setGame(prev => typeof updater === 'function' ? updater(prev) : ({ ...prev, ...updater }));
  };

  const spend = (amount, category = 'purchases') => {
    if (game.cash < amount) return false;
    patch(g => ({
      ...g,
      cash: g.cash - amount,
      monthly: { ...g.monthly, [category]: (g.monthly[category] || 0) + amount },
      stats: { ...g.stats, totalSpent: g.stats.totalSpent + amount },
    }));
    return true;
  };

  const advanceMinutes = (g, mins) => {
    let total = g.timeMinutes + mins;
    let result = { ...g, timeMinutes: total };
    while (result.timeMinutes >= 1440) {
      result.timeMinutes -= 1440;
      result = processNewDay(result);
    }
    return result;
  };

  const processNewDay = (g) => {
    const oldDate = g.date;
    const nd = nextDate(oldDate);
    let age = g.age;
    if (nd.day === g.birthday.day && nd.month === g.birthday.month) age++;

    const housing = getHousing(g.housingId);
    const car = g.activeCarId ? g.cars.find(x => x.uid === g.activeCarId) : null;
    const carBase = car ? CARS.find(x => x.id === car.catalogId) : null;

    let healthDelta = 0;
    let longHealthDelta = 0;

    if (g.fatigue > 80) { healthDelta -= 0.5; longHealthDelta -= 0.18; }
    if (g.stress > 80) { healthDelta -= 0.35; longHealthDelta -= 0.15; }
    if (g.satiety < 20) { healthDelta -= 0.6; longHealthDelta -= 0.15; }
    if (g.fitness > 60) longHealthDelta += 0.06;
    longHealthDelta += housing.healthBonus * 0.01;

    let ng = {
      ...g,
      date: nd,
      age,
      workedToday: false,
      stats: { ...g.stats, daysLived: g.stats.daysLived + 1 },
      health: clamp(g.health + healthDelta),
      hidden: {
        ...g.hidden,
        longTermHealth: clamp(g.hidden.longTermHealth + longHealthDelta),
        lifeStress: clamp(g.hidden.lifeStress + Math.max(0, g.stress - 55) * 0.004),
        burnout: clamp(g.hidden.burnout + (g.stress > 70 ? 0.15 : -0.05)),
      },
      phoneCondition: clamp(g.phoneCondition - 0.012),
    };

    if (car) {
      ng.cars = g.cars.map(x => x.uid === car.uid
        ? { ...x, mileage: x.mileage + 18, condition: clamp(x.condition - (100 - (carBase?.reliability || 50)) * 0.002, 20, 100) }
        : x
      );
    }

    for (const key of Object.keys(ng.relatives)) {
      const r = ng.relatives[key];
      if (!r.alive) continue;
      const birthdayChance = 1 / 365;
      const aged = Math.random() < birthdayChance ? { ...r, age: r.age + 1 } : r;
      ng.relatives = { ...ng.relatives, [key]: aged };
    }

    if (nd.day === 1) {
      ng = processMonth(ng);
    }

    ng = maybeDeath(ng);
    if (ng.alive) ng = maybeGenerateEvent(ng);
    return ng;
  };

  const processMonth = (g) => {
    const job = getJob(g.jobId);
    const housing = getHousing(g.housingId);

    let income = 0;
    let expenses = 0;

    if (job && g.workDaysMonth > 0) {
      const prevMonth = g.date.month === 1 ? 12 : g.date.month - 1;
      const prevYear = g.date.month === 1 ? g.date.year - 1 : g.date.year;
      const possible = Math.max(1, Math.min(22, daysInMonth(prevMonth, prevYear)));
      income += Math.round(job.salary * Math.min(1, g.workDaysMonth / possible));
    }

    let businessIncome = 0;
    const businesses = g.businesses.map(b => {
      const base = BUSINESS_CATALOG.find(x => x.id === b.catalogId);
      if (!base) return b;
      const gross = base.baseDaily * 30 * (0.85 + Math.random() * 0.3);
      const net = Math.round(gross * (1 - base.expenses));
      businessIncome += net;
      return { ...b, lastMonthProfit: net };
    });
    income += businessIncome;

    const investmentReturn = Math.round(g.investments * ((Math.random() * 0.06) - 0.02));
    income += investmentReturn;

    expenses += housing.monthly;
    expenses += getPhone(g.phoneId).monthly;

    for (const owned of g.cars) {
      const base = CARS.find(x => x.id === owned.catalogId);
      if (base) expenses += base.monthly;
    }

    const food = 7500;
    expenses += food;

    const balance = income - expenses;

    return {
      ...g,
      cash: g.cash + balance,
      workDaysMonth: 0,
      businesses,
      careerMonths: job ? g.careerMonths + 1 : g.careerMonths,
      yearsExperience: job ? Number(((g.careerMonths + 1) / 12).toFixed(1)) : g.yearsExperience,
      monthly: {
        salary: job ? income - businessIncome - investmentReturn : 0,
        business: businessIncome,
        investments: investmentReturn,
        housing: housing.monthly,
        food,
        transport: g.cars.reduce((s, owned) => {
          const base = CARS.find(x => x.id === owned.catalogId);
          return s + (base?.monthly || 0);
        }, 0),
        healthcare: 0,
        purchases: 0,
      },
      stats: {
        ...g.stats,
        totalEarned: g.stats.totalEarned + Math.max(0, income),
        totalSpent: g.stats.totalSpent + expenses,
      },
    };
  };

  const maybeDeath = (g) => {
    if (!g.alive) return g;
    const age = g.age;
    if (age < 45) return g;

    const healthQuality = (g.health * 0.35 + g.hidden.longTermHealth * 0.35 + g.fitness * 0.15 + (100 - g.hidden.lifeStress) * 0.15);
    let annualRisk = 0;
    if (age >= 45) annualRisk += (age - 44) * 0.0002;
    if (age >= 65) annualRisk += (age - 64) * 0.0012;
    if (age >= 80) annualRisk += (age - 79) * 0.006;
    annualRisk *= (1.7 - healthQuality / 100);
    if (g.health < 30) annualRisk *= 2.5;
    if (g.hidden.longTermHealth < 35) annualRisk *= 2.0;

    const dailyRisk = Math.max(0, annualRisk / 365);
    if (Math.random() < dailyRisk) {
      const cause = g.health < 30 || g.hidden.longTermHealth < 40
        ? 'осложнения, связанные с состоянием здоровья'
        : 'естественные причины';
      return {
        ...g,
        alive: false,
        causeOfDeath: cause,
        endedAt: formatDate(g.date),
      };
    }
    return g;
  };

  const maybeGenerateEvent = (g) => {
    if (g.pendingEventId) return g;
    if (g.stats.daysLived - g.lastEventDay < 5) return g;

    const chance = 0.06;
    if (Math.random() > chance) return g;

    const pool = ['family_dinner', 'friend_help'];

    if (g.jobId) {
      pool.push('coworker_funeral');
      if (g.hidden.careerTrust > 40 && g.careerMonths > 4) pool.push('promotion_chance');
    }

    if (g.health < 70 || g.fatigue > 65 || g.stress > 65) {
      pool.push('health_warning', 'health_warning');
    }

    const id = pool[Math.floor(Math.random() * pool.length)];
    return {
      ...g,
      pendingEventId: id,
      lastEventDay: g.stats.daysLived,
      stats: { ...g.stats, eventsSeen: g.stats.eventsSeen + 1 },
    };
  };

  useEffect(() => {
    if (game.pendingEventId && EVENTS[game.pendingEventId]) {
      setEvent(EVENTS[game.pendingEventId]);
    } else {
      setEvent(null);
    }
  }, [game.pendingEventId]);

  const doWork = () => {
    const job = currentJob;
    if (!job) return Alert.alert('Работа', 'Сначала устройся на работу.');
    if (game.workedToday) return Alert.alert('Работа', 'Сегодня смена уже отработана.');
    if (game.energy < job.energy || game.fatigue > 90) return Alert.alert('Слишком устал', 'Сейчас полноценная смена может сильно ухудшить состояние.');

    patch(g => {
      let skillGain = 0.5;
      if (g.fatigue > 70 || g.stress > 75) skillGain *= 0.6;
      return advanceMinutes({
        ...g,
        energy: clamp(g.energy - job.energy),
        fatigue: clamp(g.fatigue + job.fatigue),
        stress: clamp(g.stress + job.stress),
        satiety: clamp(g.satiety - 18),
        mood: clamp(g.mood - (job.stress > 15 ? 4 : 1)),
        professionalSkill: clamp(g.professionalSkill + skillGain),
        reputation: clamp(g.reputation + 0.15),
        workedToday: true,
        workDaysMonth: g.workDaysMonth + 1,
        hidden: {
          ...g.hidden,
          careerTrust: clamp(g.hidden.careerTrust + (g.hidden.reliability > 55 ? 0.2 : 0.08)),
          burnout: clamp(g.hidden.burnout + job.stress * 0.025),
        },
      }, job.hours * 60);
    });
  };

  const eat = (kind) => {
    const opts = {
      cheap: { cost: 120, satiety: 30, mood: 0, health: -0.1, mins: 25 },
      normal: { cost: 280, satiety: 45, mood: 2, health: 0.1, mins: 40 },
      good: { cost: 650, satiety: 55, mood: 5, health: 0.25, mins: 60 },
    };
    const o = opts[kind];
    if (game.cash < o.cost) return Alert.alert('Недостаточно денег');
    patch(g => advanceMinutes({
      ...g,
      cash: g.cash - o.cost,
      satiety: clamp(g.satiety + o.satiety),
      mood: clamp(g.mood + o.mood),
      health: clamp(g.health + o.health),
      monthly: { ...g.monthly, food: g.monthly.food + o.cost },
      stats: { ...g.stats, totalSpent: g.stats.totalSpent + o.cost },
    }, o.mins));
  };

  const workout = () => {
    if (game.energy < 22 || game.fatigue > 82) return Alert.alert('Тренировка', 'Сейчас организму нужен отдых.');
    patch(g => advanceMinutes({
      ...g,
      energy: clamp(g.energy - 22),
      fatigue: clamp(g.fatigue + 15),
      satiety: clamp(g.satiety - 10),
      fitness: clamp(g.fitness + 0.8),
      health: clamp(g.health + 0.25),
      mood: clamp(g.mood + 3),
      stress: clamp(g.stress - 4),
    }, 90));
  };

  const study = () => {
    if (game.energy < 20 || game.fatigue > 85) return Alert.alert('Учёба', 'Ты слишком устал, чтобы нормально концентрироваться.');
    patch(g => advanceMinutes({
      ...g,
      energy: clamp(g.energy - 18),
      fatigue: clamp(g.fatigue + 11),
      satiety: clamp(g.satiety - 7),
      intelligence: clamp(g.intelligence + 0.65),
      mood: clamp(g.mood - 1),
      stress: clamp(g.stress + 2),
    }, 120));
  };

  const sleep = (hours) => {
    if (hours < 4) return;
    patch(g => {
      const recovery = hours >= 8 ? 78 : hours >= 7 ? 66 : hours >= 6 ? 54 : 34;
      const fatigueDrop = hours >= 8 ? 70 : hours >= 7 ? 59 : hours >= 6 ? 45 : 27;
      const healthDelta = hours >= 7 ? 0.3 : -0.25;
      const moodDelta = hours >= 7 ? 2 : -3;
      return advanceMinutes({
        ...g,
        energy: clamp(g.energy + recovery),
        fatigue: clamp(g.fatigue - fatigueDrop),
        satiety: clamp(g.satiety - hours * 1.6),
        health: clamp(g.health + healthDelta),
        mood: clamp(g.mood + moodDelta),
        stress: clamp(g.stress - (hours >= 7 ? 8 : 3)),
        hidden: {
          ...g.hidden,
          longTermHealth: clamp(g.hidden.longTermHealth + (hours >= 7 ? 0.08 : -0.12)),
          burnout: clamp(g.hidden.burnout - (hours >= 7 ? 0.35 : 0.1)),
        },
      }, hours * 60);
    });
  };

  const jobAvailable = (job) => {
    const r = job.req;
    return game.intelligence >= r.intelligence &&
      game.charisma >= r.charisma &&
      game.professionalSkill >= r.skill &&
      game.reputation >= r.reputation;
  };

  const takeJob = (job) => {
    if (!jobAvailable(job)) return Alert.alert('Вакансия недоступна', 'Не хватает навыков или репутации.');
    patch(g => ({
      ...g,
      jobId: job.id,
      workedToday: false,
      stats: { ...g.stats, jobsHeld: g.stats.jobsHeld + 1 },
    }));
  };

  const buyPhone = (p) => {
    if (game.cash < p.price) return Alert.alert('Недостаточно денег');
    Alert.alert(
      `${p.brand} ${p.model}`,
      `Купить за ${money(p.price)} ₴?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Купить',
          onPress: () => patch(g => ({
            ...g,
            cash: g.cash - p.price,
            phoneId: p.id,
            phoneCondition: 100,
            mood: clamp(g.mood + Math.min(8, p.prestige / 15)),
            monthly: { ...g.monthly, purchases: g.monthly.purchases + p.price },
            stats: { ...g.stats, totalSpent: g.stats.totalSpent + p.price },
          })),
        },
      ]
    );
  };

  const buyCar = (car) => {
    if (game.cash < car.price) return Alert.alert('Недостаточно денег');
    Alert.alert(
      `${car.brand} ${car.model}`,
      `Стоимость ${money(car.price)} ₴. Ежемесячное содержание около ${money(car.monthly)} ₴.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Купить',
          onPress: () => patch(g => {
            const uid = `${car.id}_${Date.now()}`;
            return {
              ...g,
              cash: g.cash - car.price,
              cars: [...g.cars, { uid, catalogId: car.id, condition: 100, mileage: 0 }],
              activeCarId: g.activeCarId || uid,
              mood: clamp(g.mood + Math.min(10, car.prestige / 10)),
              stats: { ...g.stats, totalSpent: g.stats.totalSpent + car.price },
            };
          }),
        },
      ]
    );
  };

  const sellCar = (owned) => {
    const base = CARS.find(x => x.id === owned.catalogId);
    if (!base) return;
    const price = Math.round(base.price * (owned.condition / 100) * 0.68);
    Alert.alert('Продать автомобиль?', `Ориентировочно ${money(price)} ₴`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Продать',
        style: 'destructive',
        onPress: () => patch(g => ({
          ...g,
          cash: g.cash + price,
          cars: g.cars.filter(x => x.uid !== owned.uid),
          activeCarId: g.activeCarId === owned.uid ? null : g.activeCarId,
          stats: { ...g.stats, totalEarned: g.stats.totalEarned + price },
        })),
      },
    ]);
  };

  const chooseHousing = (h) => {
    if (h.type === 'rent') {
      patch(g => ({ ...g, housingId: h.id }));
      return;
    }
    const owns = game.properties.some(p => p.catalogId === h.id);
    if (owns) {
      patch(g => ({ ...g, housingId: h.id }));
      return;
    }
    if (game.cash < h.price) return Alert.alert('Недостаточно денег');
    Alert.alert('Покупка недвижимости', `${h.name}\n${money(h.price)} ₴`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Купить',
        onPress: () => patch(g => ({
          ...g,
          cash: g.cash - h.price,
          housingId: h.id,
          properties: [...g.properties, { catalogId: h.id, boughtAt: g.date }],
          stats: { ...g.stats, totalSpent: g.stats.totalSpent + h.price },
        })),
      },
    ]);
  };

  const buyBusiness = (b) => {
    if (game.cash < b.price) return Alert.alert('Недостаточно денег');
    patch(g => ({
      ...g,
      cash: g.cash - b.price,
      businesses: [...g.businesses, { uid: `${b.id}_${Date.now()}`, catalogId: b.id, lastMonthProfit: 0 }],
      stats: { ...g.stats, totalSpent: g.stats.totalSpent + b.price },
    }));
  };

  const invest = (amount) => {
    if (game.cash < amount) return Alert.alert('Недостаточно денег');
    patch(g => ({ ...g, cash: g.cash - amount, investments: g.investments + amount }));
  };

  const resolveEvent = (choice) => {
    if (!event) return;
    if (choice.cost && game.cash < choice.cost) {
      return Alert.alert('Недостаточно денег', 'Этот вариант сейчас недоступен.');
    }

    patch(g => {
      let ng = { ...g };
      if (choice.cost) {
        ng.cash -= choice.cost;
        ng.stats = { ...ng.stats, totalSpent: ng.stats.totalSpent + choice.cost };
      }
      const e = choice.effect || {};
      ng.health = clamp(ng.health + (e.health || 0));
      ng.energy = clamp(ng.energy + (e.energy || 0));
      ng.fatigue = clamp(ng.fatigue + (e.fatigue || 0));
      ng.satiety = clamp(ng.satiety + (e.satiety || 0));
      ng.mood = clamp(ng.mood + (e.mood || 0));
      ng.stress = clamp(ng.stress + (e.stress || 0));
      ng.hidden = {
        ...ng.hidden,
        familyBond: clamp(ng.hidden.familyBond + (e.familyBond || 0)),
        socialTrust: clamp(ng.hidden.socialTrust + (e.socialTrust || 0)),
        careerTrust: clamp(ng.hidden.careerTrust + (e.careerTrust || 0)),
        empathy: clamp(ng.hidden.empathy + (e.empathy || 0)),
        reliability: clamp(ng.hidden.reliability + (e.reliability || 0)),
        loneliness: clamp(ng.hidden.loneliness + (e.loneliness || 0)),
        longTermHealth: clamp(ng.hidden.longTermHealth + (e.longTermHealth || 0)),
      };
      ng.memories = [...ng.memories, {
        date: formatDate(ng.date),
        age: ng.age,
        text: choice.memory,
      }].slice(-80);

      if (choice.special === 'promotion_try') {
        const chance =
          0.15 +
          ng.hidden.careerTrust / 200 +
          ng.reputation / 300 +
          ng.professionalSkill / 400;
        if (Math.random() < chance) {
          ng.reputation = clamp(ng.reputation + 5);
          ng.charisma = clamp(ng.charisma + 2);
          ng.hidden.careerTrust = clamp(ng.hidden.careerTrust + 7);
          ng.memories.push({ date: formatDate(ng.date), age: ng.age, text: 'Удачно проявил себя в разговоре о повышении' });
        } else {
          ng.stress = clamp(ng.stress + 3);
        }
      }

      ng.pendingEventId = null;
      if (e.time) ng = advanceMinutes(ng, e.time);
      return ng;
    });
  };

  const resetGame = () => {
    Alert.alert('Начать новую жизнь?', 'Весь прогресс будет удалён.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(SAVE_KEY);
          setGame(START);
          setScreen('home');
        },
      },
    ]);
  };

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator />
        <Text style={styles.loadingText}>Загрузка сохранения…</Text>
      </View>
    );
  }

  if (!game.alive) {
    return <DeathScreen game={game} netWorth={netWorth} resetGame={resetGame} />;
  }

  const props = {
    game,
    currentJob,
    currentPhone,
    currentHousing,
    netWorth,
    doWork,
    eat,
    workout,
    study,
    sleep,
    takeJob,
    jobAvailable,
    buyPhone,
    buyCar,
    sellCar,
    chooseHousing,
    buyBusiness,
    invest,
    marketTab,
    setMarketTab,
    resetGame,
    patch,
  };

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="light-content" />
      <TopBar game={game} />
      <View style={styles.main}>
        {screen === 'home' && <HomeScreen {...props} />}
        {screen === 'career' && <CareerScreen {...props} />}
        {screen === 'market' && <MarketScreen {...props} />}
        {screen === 'assets' && <AssetsScreen {...props} />}
        {screen === 'more' && <MoreScreen {...props} />}
      </View>
      <BottomNav screen={screen} setScreen={setScreen} />
      <EventModal event={event} onChoice={resolveEvent} />
    </SafeAreaView>
  );
}

function TopBar({ game }) {
  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.logo}>LIFE</Text>
        <Text style={styles.topDate}>{formatDate(game.date)} · {formatTime(game.timeMinutes)}</Text>
      </View>
      <Text style={styles.topMoney}>{money(game.cash)} ₴</Text>
    </View>
  );
}

function HomeScreen({ game, currentJob, currentPhone, currentHousing, netWorth, doWork, eat, workout, study, sleep }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>СЕГОДНЯ</Text>
      <Text style={styles.heroTitle}>{game.age} лет</Text>
      <Text style={styles.heroSub}>{formatDate(game.date)} · {formatTime(game.timeMinutes)}</Text>

      <View style={styles.netCard}>
        <Text style={styles.cardCaption}>Чистый капитал</Text>
        <Text style={styles.netValue}>{money(netWorth)} ₴</Text>
        <View style={styles.netLine} />
        <View style={styles.dualRow}>
          <SmallInfo label="Наличные" value={`${money(game.cash)} ₴`} />
          <SmallInfo label="Работа" value={currentJob ? currentJob.name : 'Нет'} right />
        </View>
      </View>

      <Section title="Состояние" right="организм" />
      <View style={styles.grid2}>
        <StateTile title="Энергия" value={game.energy} good high />
        <StateTile title="Усталость" value={game.fatigue} good={false} high={false} />
        <StateTile title="Сытость" value={game.satiety} good high />
        <StateTile title="Стресс" value={game.stress} good={false} high={false} />
        <StateTile title="Здоровье" value={game.health} good high />
        <StateTile title="Настроение" value={game.mood} good high />
      </View>

      <Section title="День" right={`${formatTime(game.timeMinutes)}`} />
      {currentJob && (
        <ActionRow
          title="Рабочая смена"
          subtitle={`${currentJob.company} · ${currentJob.hours} ч`}
          meta={game.workedToday ? 'Выполнено' : `−${currentJob.energy} энергии`}
          disabled={game.workedToday}
          onPress={doWork}
        />
      )}
      <ActionRow title="Самообразование" subtitle="2 часа · интеллект" meta="−18 энергии" onPress={study} />
      <ActionRow title="Тренировка" subtitle="1 ч 30 мин · форма и здоровье" meta="−22 энергии" onPress={workout} />

      <Section title="Питание" />
      <ActionRow title="Перекус" subtitle="Быстро и дёшево" meta="120 ₴" onPress={() => eat('cheap')} />
      <ActionRow title="Нормальная еда" subtitle="Сбалансированный приём пищи" meta="280 ₴" onPress={() => eat('normal')} />
      <ActionRow title="Хороший ресторан" subtitle="Лучше настроение и питание" meta="650 ₴" onPress={() => eat('good')} />

      <Section title="Сон" right="восстановление" />
      <View style={styles.choiceRow}>
        {[6, 7, 8, 9].map(h => (
          <Pressable key={h} style={styles.choicePill} onPress={() => sleep(h)}>
            <Text style={styles.choicePillBig}>{h}</Text>
            <Text style={styles.choicePillSmall}>часов</Text>
          </Pressable>
        ))}
      </View>

      <Section title="Текущая жизнь" />
      <InfoCard rows={[
        ['Телефон', `${currentPhone.brand} ${currentPhone.model}`],
        ['Состояние телефона', `${Math.round(game.phoneCondition)}%`],
        ['Жильё', currentHousing.name],
        ['Автомобиль', game.activeCarId ? 'Есть' : 'Нет'],
      ]} />
    </ScrollView>
  );
}

function CareerScreen({ game, currentJob, takeJob, jobAvailable }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>КАРЬЕРА</Text>
      <Text style={styles.heroTitle}>Работа</Text>
      <Text style={styles.heroSub}>Навыки, опыт и отношение людей важнее условных уровней.</Text>

      {currentJob && (
        <>
          <Section title="Текущая должность" />
          <View style={styles.featureCard}>
            <Text style={styles.featureBrand}>{currentJob.company}</Text>
            <Text style={styles.featureTitle}>{currentJob.name}</Text>
            <Text style={styles.featurePrice}>{money(currentJob.salary)} ₴ / месяц</Text>
            <Text style={styles.featureSub}>Опыт: {game.yearsExperience} года · Отработано в месяце: {game.workDaysMonth} дней</Text>
          </View>
        </>
      )}

      <Section title="Навыки" />
      <Metric label="Интеллект" value={game.intelligence} />
      <Metric label="Харизма" value={game.charisma} />
      <Metric label="Профессиональный навык" value={game.professionalSkill} />
      <Metric label="Репутация" value={game.reputation} />

      <Section title="Вакансии" />
      {JOBS.map(job => {
        const ok = jobAvailable(job);
        const active = game.jobId === job.id;
        return (
          <Pressable
            key={job.id}
            style={[styles.listCard, active && styles.listCardActive]}
            onPress={() => takeJob(job)}
          >
            <View style={styles.listTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listBrand}>{job.company}</Text>
                <Text style={styles.listTitle}>{job.name}</Text>
              </View>
              <Text style={[styles.statusText, { color: ok ? C.green : C.muted }]}>
                {active ? 'РАБОТАЕТЕ' : ok ? 'ДОСТУПНО' : 'НЕДОСТУПНО'}
              </Text>
            </View>
            <Text style={styles.listPrice}>{money(job.salary)} ₴ / месяц</Text>
            {!ok && (
              <View style={styles.requireBox}>
                <Req label="Интеллект" current={game.intelligence} need={job.req.intelligence} />
                <Req label="Харизма" current={game.charisma} need={job.req.charisma} />
                <Req label="Навык" current={game.professionalSkill} need={job.req.skill} />
                <Req label="Репутация" current={game.reputation} need={job.req.reputation} />
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function MarketScreen(props) {
  const { marketTab, setMarketTab } = props;
  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabWrap} contentContainerStyle={styles.tabContent}>
        {[
          ['phones', 'Техника'],
          ['cars', 'Авто'],
          ['housing', 'Жильё'],
          ['business', 'Бизнес'],
          ['invest', 'Инвестиции'],
        ].map(([id, label]) => (
          <Pressable key={id} style={[styles.tab, marketTab === id && styles.tabActive]} onPress={() => setMarketTab(id)}>
            <Text style={[styles.tabText, marketTab === id && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {marketTab === 'phones' && <PhonesMarket {...props} />}
      {marketTab === 'cars' && <CarsMarket {...props} />}
      {marketTab === 'housing' && <HousingMarket {...props} />}
      {marketTab === 'business' && <BusinessMarket {...props} />}
      {marketTab === 'invest' && <InvestmentMarket {...props} />}
    </View>
  );
}

function PhonesMarket({ game, buyPhone }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.contentWithTabs} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>ТЕХНИКА</Text>
      <Text style={styles.heroTitle}>Смартфоны</Text>
      <Text style={styles.heroSub}>От старой дешёвой техники до флагманов.</Text>
      {PHONES.map(p => {
        const owned = game.phoneId === p.id;
        return (
          <View key={p.id} style={[styles.productCard, owned && styles.listCardActive]}>
            <View style={styles.listTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listBrand}>{p.brand} · {p.year}</Text>
                <Text style={styles.productTitle}>{p.model}</Text>
              </View>
              {owned && <Text style={styles.owned}>ИСПОЛЬЗУЕТСЯ</Text>}
            </View>
            <Text style={styles.productPrice}>{money(p.price)} ₴</Text>
            <Spec label="Производительность" value={p.performance} />
            <Spec label="Камера" value={p.camera} />
            <Spec label="Престиж" value={p.prestige} />
            {!owned && (
              <Pressable style={styles.buyButton} onPress={() => buyPhone(p)}>
                <Text style={styles.buyButtonText}>Купить</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function CarsMarket({ game, buyCar }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.contentWithTabs} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>АВТОСАЛОНЫ</Text>
      <Text style={styles.heroTitle}>Автомобили</Text>
      <Text style={styles.heroSub}>Содержание автомобиля может быть важнее цены покупки.</Text>
      {CARS.map(car => (
        <View key={car.id} style={styles.productCard}>
          <Text style={styles.listBrand}>{car.brand} · {car.year}</Text>
          <Text style={styles.productTitle}>{car.model}</Text>
          <Text style={styles.productPrice}>{money(car.price)} ₴</Text>
          <Spec label="Надёжность" value={car.reliability} />
          <Spec label="Комфорт" value={car.comfort} />
          <Spec label="Престиж" value={car.prestige} />
          <Text style={styles.productFoot}>Ориентировочные расходы: {money(car.monthly)} ₴ / месяц</Text>
          <Pressable style={styles.buyButton} onPress={() => buyCar(car)}>
            <Text style={styles.buyButtonText}>Купить автомобиль</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function HousingMarket({ game, chooseHousing }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.contentWithTabs} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>НЕДВИЖИМОСТЬ</Text>
      <Text style={styles.heroTitle}>Жильё</Text>
      <Text style={styles.heroSub}>Комфорт влияет на качество восстановления и образ жизни.</Text>
      {HOUSING.map(h => {
        const active = game.housingId === h.id;
        const owns = game.properties.some(p => p.catalogId === h.id);
        return (
          <View key={h.id} style={[styles.productCard, active && styles.listCardActive]}>
            <Text style={styles.listBrand}>{h.type === 'rent' ? 'АРЕНДА' : 'ПОКУПКА'}</Text>
            <Text style={styles.productTitle}>{h.name}</Text>
            <Text style={styles.productPrice}>{h.type === 'buy' ? `${money(h.price)} ₴` : `${money(h.monthly)} ₴ / месяц`}</Text>
            <Spec label="Комфорт" value={h.comfort} />
            <Spec label="Престиж" value={h.prestige} />
            <Text style={styles.productFoot}>Ежемесячные расходы: {money(h.monthly)} ₴</Text>
            <Pressable style={styles.buyButton} onPress={() => chooseHousing(h)}>
              <Text style={styles.buyButtonText}>{active ? 'Текущее жильё' : owns ? 'Переехать сюда' : h.type === 'rent' ? 'Арендовать' : 'Купить'}</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

function BusinessMarket({ game, buyBusiness }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.contentWithTabs} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>ПРЕДПРИНИМАТЕЛЬСТВО</Text>
      <Text style={styles.heroTitle}>Бизнес</Text>
      <Text style={styles.heroSub}>Прибыль не гарантирована и меняется от месяца к месяцу.</Text>
      {BUSINESS_CATALOG.map(b => (
        <View key={b.id} style={styles.productCard}>
          <Text style={styles.listBrand}>ГОТОВЫЙ БИЗНЕС</Text>
          <Text style={styles.productTitle}>{b.name}</Text>
          <Text style={styles.productPrice}>{money(b.price)} ₴</Text>
          <Text style={styles.productFoot}>Средняя дневная выручка до расходов: около {money(b.baseDaily)} ₴</Text>
          <Pressable style={styles.buyButton} onPress={() => buyBusiness(b)}>
            <Text style={styles.buyButtonText}>Открыть бизнес</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function InvestmentMarket({ game, invest }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.contentWithTabs} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>КАПИТАЛ</Text>
      <Text style={styles.heroTitle}>Инвестиции</Text>
      <Text style={styles.heroSub}>Упрощённый диверсифицированный портфель. Доходность может быть и отрицательной.</Text>
      <View style={styles.netCard}>
        <Text style={styles.cardCaption}>В портфеле</Text>
        <Text style={styles.netValue}>{money(game.investments)} ₴</Text>
      </View>
      <Section title="Пополнить" />
      <View style={styles.choiceRow}>
        {[1000, 5000, 10000, 50000].map(v => (
          <Pressable key={v} style={styles.choicePill} onPress={() => invest(v)}>
            <Text style={styles.choicePillBig}>{v >= 1000 ? `${v/1000}k` : v}</Text>
            <Text style={styles.choicePillSmall}>₴</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function AssetsScreen({ game, currentPhone, currentHousing, netWorth, sellCar, patch }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>АКТИВЫ</Text>
      <Text style={styles.heroTitle}>{money(netWorth)} ₴</Text>
      <Text style={styles.heroSub}>Оценочная стоимость всего, чем ты владеешь.</Text>

      <Section title="Техника" />
      <View style={styles.featureCard}>
        <Text style={styles.featureBrand}>{currentPhone.brand}</Text>
        <Text style={styles.featureTitle}>{currentPhone.model}</Text>
        <Text style={styles.featureSub}>Состояние: {Math.round(game.phoneCondition)}%</Text>
      </View>

      <Section title="Жильё" />
      <View style={styles.featureCard}>
        <Text style={styles.featureBrand}>ТЕКУЩЕЕ</Text>
        <Text style={styles.featureTitle}>{currentHousing.name}</Text>
        <Text style={styles.featureSub}>Расходы: {money(currentHousing.monthly)} ₴ / месяц</Text>
      </View>

      <Section title="Автомобили" right={`${game.cars.length}`} />
      {game.cars.length === 0 && <Empty text="Автомобилей пока нет." />}
      {game.cars.map(owned => {
        const base = CARS.find(x => x.id === owned.catalogId);
        if (!base) return null;
        const active = game.activeCarId === owned.uid;
        return (
          <View key={owned.uid} style={[styles.productCard, active && styles.listCardActive]}>
            <Text style={styles.listBrand}>{base.brand} · {base.year}</Text>
            <Text style={styles.productTitle}>{base.model}</Text>
            <Text style={styles.productFoot}>Пробег: {money(owned.mileage)} км · Состояние: {Math.round(owned.condition)}%</Text>
            <View style={styles.inlineButtons}>
              <Pressable style={styles.smallButton} onPress={() => patch(g => ({ ...g, activeCarId: owned.uid }))}>
                <Text style={styles.smallButtonText}>{active ? 'Используется' : 'Использовать'}</Text>
              </Pressable>
              <Pressable style={[styles.smallButton, styles.dangerButton]} onPress={() => sellCar(owned)}>
                <Text style={[styles.smallButtonText, { color: C.red }]}>Продать</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <Section title="Недвижимость" right={`${game.properties.length}`} />
      {game.properties.length === 0 && <Empty text="Собственной недвижимости нет." />}
      {game.properties.map((p, i) => {
        const h = HOUSING.find(x => x.id === p.catalogId);
        return h ? (
          <View key={`${p.catalogId}_${i}`} style={styles.listCard}>
            <Text style={styles.listBrand}>СОБСТВЕННОСТЬ</Text>
            <Text style={styles.listTitle}>{h.name}</Text>
            <Text style={styles.listPrice}>{money(h.price)} ₴</Text>
          </View>
        ) : null;
      })}

      <Section title="Бизнесы" right={`${game.businesses.length}`} />
      {game.businesses.length === 0 && <Empty text="Бизнесов пока нет." />}
      {game.businesses.map(b => {
        const base = BUSINESS_CATALOG.find(x => x.id === b.catalogId);
        return base ? (
          <View key={b.uid} style={styles.listCard}>
            <Text style={styles.listBrand}>ВАШ БИЗНЕС</Text>
            <Text style={styles.listTitle}>{base.name}</Text>
            <Text style={[styles.listPrice, { color: b.lastMonthProfit >= 0 ? C.green : C.red }]}>
              {b.lastMonthProfit >= 0 ? '+' : ''}{money(b.lastMonthProfit)} ₴ за прошлый месяц
            </Text>
          </View>
        ) : null;
      })}
    </ScrollView>
  );
}

function MoreScreen({ game, netWorth, resetGame }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>ПЕРСОНАЖ</Text>
      <Text style={styles.heroTitle}>{game.age} лет</Text>
      <Text style={styles.heroSub}>История жизни формируется из решений, а не из уровней.</Text>

      <Section title="Организм" />
      <Metric label="Здоровье" value={game.health} />
      <Metric label="Физическая форма" value={game.fitness} />
      <Metric label="Стресс" value={game.stress} inverse />
      <Metric label="Усталость" value={game.fatigue} inverse />

      <Section title="Финансы за месяц" />
      <InfoCard rows={[
        ['Зарплата', `+${money(game.monthly.salary)} ₴`],
        ['Бизнес', `${game.monthly.business >= 0 ? '+' : ''}${money(game.monthly.business)} ₴`],
        ['Инвестиции', `${game.monthly.investments >= 0 ? '+' : ''}${money(game.monthly.investments)} ₴`],
        ['Жильё', `−${money(game.monthly.housing)} ₴`],
        ['Питание', `−${money(game.monthly.food)} ₴`],
        ['Транспорт', `−${money(game.monthly.transport)} ₴`],
      ]} />

      <Section title="Статистика" />
      <InfoCard rows={[
        ['Прожито дней', String(game.stats.daysLived)],
        ['Чистый капитал', `${money(netWorth)} ₴`],
        ['Всего заработано', `${money(game.stats.totalEarned)} ₴`],
        ['Всего потрачено', `${money(game.stats.totalSpent)} ₴`],
        ['Событий пережито', String(game.stats.eventsSeen)],
      ]} />

      <Section title="Последние события" />
      {game.memories.length === 0 && <Empty text="История пока только начинается." />}
      {[...game.memories].reverse().slice(0, 12).map((m, i) => (
        <View key={`${m.date}_${i}`} style={styles.memory}>
          <Text style={styles.memoryDate}>{m.date} · {m.age} лет</Text>
          <Text style={styles.memoryText}>{m.text}</Text>
        </View>
      ))}

      <Pressable style={styles.reset} onPress={resetGame}>
        <Text style={styles.resetText}>Начать новую жизнь</Text>
      </Pressable>
    </ScrollView>
  );
}

function DeathScreen({ game, netWorth, resetGame }) {
  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.deathContent}>
        <Text style={styles.kicker}>ЖИЗНЬ ЗАВЕРШЕНА</Text>
        <Text style={styles.deathAge}>{game.age}</Text>
        <Text style={styles.deathYears}>лет</Text>
        <Text style={styles.deathCause}>Причина смерти: {game.causeOfDeath}</Text>
        <View style={styles.netLine} />
        <InfoCard rows={[
          ['Прожито дней', String(game.stats.daysLived)],
          ['Итоговый капитал', `${money(netWorth)} ₴`],
          ['Всего заработано', `${money(game.stats.totalEarned)} ₴`],
          ['Автомобили', String(game.cars.length)],
          ['Недвижимость', String(game.properties.length)],
          ['Бизнесы', String(game.businesses.length)],
        ]} />
        <Section title="Последние главы" />
        {[...game.memories].reverse().slice(0, 10).map((m, i) => (
          <View key={i} style={styles.memory}>
            <Text style={styles.memoryDate}>{m.date} · {m.age} лет</Text>
            <Text style={styles.memoryText}>{m.text}</Text>
          </View>
        ))}
        <Pressable style={styles.buyButton} onPress={resetGame}>
          <Text style={styles.buyButtonText}>Начать новую жизнь</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function EventModal({ event, onChoice }) {
  return (
    <Modal visible={!!event} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.kicker}>СОБЫТИЕ</Text>
          <Text style={styles.modalTitle}>{event?.title}</Text>
          <Text style={styles.modalText}>{event?.text}</Text>
          {event?.choices.map((c, i) => (
            <Pressable key={i} style={styles.modalChoice} onPress={() => onChoice(c)}>
              <Text style={styles.modalChoiceText}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function BottomNav({ screen, setScreen }) {
  const items = [
    ['home', 'Сегодня'],
    ['career', 'Карьера'],
    ['market', 'Рынок'],
    ['assets', 'Активы'],
    ['more', 'Ещё'],
  ];
  return (
    <View style={styles.bottomNav}>
      {items.map(([id, label]) => {
        const active = screen === id;
        return (
          <Pressable key={id} style={styles.navItem} onPress={() => setScreen(id)}>
            <View style={[styles.navDot, active && styles.navDotActive]} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({ title, right }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!right && <Text style={styles.sectionRight}>{right}</Text>}
    </View>
  );
}

function SmallInfo({ label, value, right }) {
  return (
    <View style={right ? { alignItems: 'flex-end', maxWidth: '55%' } : { maxWidth: '45%' }}>
      <Text style={styles.smallLabel}>{label}</Text>
      <Text style={styles.smallValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function StateTile({ title, value, good, high }) {
  let color = C.green;
  const v = Math.round(value);
  if (good) {
    if (v < 30) color = C.red;
    else if (v < 60) color = C.yellow;
  } else {
    if (v > 75) color = C.red;
    else if (v > 45) color = C.yellow;
    else color = C.green;
  }
  return (
    <View style={styles.stateTile}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateValue}>{v}%</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${clamp(v)}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

function ActionRow({ title, subtitle, meta, onPress, disabled }) {
  return (
    <Pressable style={[styles.actionRow, disabled && { opacity: 0.45 }]} onPress={onPress} disabled={disabled}>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
      <Text style={styles.actionMeta}>{meta}</Text>
    </Pressable>
  );
}

function Metric({ label, value, inverse }) {
  const v = clamp(Math.round(value));
  let color = C.green;
  if (inverse) {
    if (v > 75) color = C.red;
    else if (v > 45) color = C.yellow;
  } else {
    if (v < 30) color = C.red;
    else if (v < 60) color = C.yellow;
  }
  return (
    <View style={styles.metric}>
      <View style={styles.dualRow}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{v}</Text>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${v}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

function Req({ label, current, need }) {
  const ok = current >= need;
  return (
    <View style={styles.reqRow}>
      <Text style={styles.reqLabel}>{label}</Text>
      <Text style={[styles.reqValue, { color: ok ? C.green : C.red }]}>{Math.round(current)} / {need}</Text>
    </View>
  );
}

function Spec({ label, value }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <View style={styles.specTrack}><View style={[styles.specFill, { width: `${clamp(value)}%` }]} /></View>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

function InfoCard({ rows }) {
  return (
    <View style={styles.infoCard}>
      {rows.map((r, i) => (
        <View key={i} style={[styles.infoRow, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>{r[0]}</Text>
          <Text style={styles.infoValue}>{r[1]}</Text>
        </View>
      ))}
    </View>
  );
}

function Empty({ text }) {
  return <Text style={styles.empty}>{text}</Text>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.bg },
  main: { flex: 1 },
  loading: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: C.sub, marginTop: 12 },

  topBar: {
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#181B20',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { color: C.text, fontSize: 16, fontWeight: '900', letterSpacing: 3.5 },
  topDate: { color: C.muted, fontSize: 10, marginTop: 3 },
  topMoney: { color: C.text, fontSize: 15, fontWeight: '700' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 38 },
  contentWithTabs: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 38 },

  kicker: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  heroTitle: { color: C.text, fontSize: 31, fontWeight: '760', letterSpacing: -0.8 },
  heroSub: { color: C.sub, fontSize: 13, lineHeight: 19, marginTop: 6 },

  netCard: {
    marginTop: 22,
    padding: 19,
    borderRadius: 17,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardCaption: { color: C.sub, fontSize: 11 },
  netValue: { color: C.text, fontSize: 31, fontWeight: '760', marginTop: 5, letterSpacing: -0.7 },
  netLine: { height: 1, backgroundColor: C.border, marginVertical: 17 },
  dualRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallLabel: { color: C.muted, fontSize: 10 },
  smallValue: { color: C.text, fontSize: 12, fontWeight: '600', marginTop: 4 },

  section: { marginTop: 28, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  sectionRight: { color: C.muted, fontSize: 10 },

  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateTile: {
    width: '48.7%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  stateTitle: { color: C.muted, fontSize: 10 },
  stateValue: { color: C.text, fontSize: 18, fontWeight: '700', marginTop: 4 },

  progressTrack: { height: 4, borderRadius: 4, backgroundColor: '#292D34', overflow: 'hidden', marginTop: 9 },
  progressFill: { height: '100%', borderRadius: 4 },

  actionRow: {
    minHeight: 68,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTitle: { color: C.text, fontSize: 14, fontWeight: '650' },
  actionSub: { color: C.muted, fontSize: 10, marginTop: 4 },
  actionMeta: { color: C.sub, fontSize: 10, marginLeft: 12 },

  choiceRow: { flexDirection: 'row', gap: 8 },
  choicePill: {
    flex: 1,
    height: 62,
    borderRadius: 13,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choicePillBig: { color: C.text, fontSize: 16, fontWeight: '700' },
  choicePillSmall: { color: C.muted, fontSize: 9, marginTop: 2 },

  featureCard: {
    padding: 17,
    borderRadius: 15,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  featureBrand: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  featureTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginTop: 6 },
  featurePrice: { color: C.green, fontSize: 14, fontWeight: '700', marginTop: 7 },
  featureSub: { color: C.sub, fontSize: 11, marginTop: 7, lineHeight: 17 },

  metric: {
    padding: 14,
    borderRadius: 13,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 7,
  },
  metricLabel: { color: C.sub, fontSize: 11 },
  metricValue: { color: C.text, fontSize: 11, fontWeight: '700' },

  listCard: {
    padding: 16,
    borderRadius: 15,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 9,
  },
  listCardActive: { borderColor: '#4E5577' },
  listTop: { flexDirection: 'row', alignItems: 'flex-start' },
  listBrand: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  listTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 4 },
  listPrice: { color: C.green, fontSize: 14, fontWeight: '700', marginTop: 12 },
  statusText: { fontSize: 8, fontWeight: '800', marginLeft: 8 },

  requireBox: { marginTop: 13, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  reqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  reqLabel: { color: C.muted, fontSize: 10 },
  reqValue: { fontSize: 10, fontWeight: '700' },

  tabWrap: { maxHeight: 51, borderBottomWidth: 1, borderBottomColor: '#181B20' },
  tabContent: { paddingHorizontal: 14, gap: 5, alignItems: 'center' },
  tab: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10 },
  tabActive: { backgroundColor: C.surface2 },
  tabText: { color: C.muted, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: C.text },

  productCard: {
    padding: 17,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  productTitle: { color: C.text, fontSize: 20, fontWeight: '720', marginTop: 5, letterSpacing: -0.3 },
  productPrice: { color: C.text, fontSize: 21, fontWeight: '720', marginTop: 13, marginBottom: 14 },
  productFoot: { color: C.sub, fontSize: 10, lineHeight: 16, marginTop: 12 },
  owned: { color: C.green, fontSize: 8, fontWeight: '800' },

  specRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  specLabel: { color: C.sub, fontSize: 10, width: 115 },
  specTrack: { flex: 1, height: 3, borderRadius: 3, backgroundColor: '#2A2E35', overflow: 'hidden' },
  specFill: { height: '100%', backgroundColor: C.accent },
  specValue: { color: C.text, fontSize: 10, fontWeight: '700', width: 28, textAlign: 'right' },

  buyButton: {
    marginTop: 16,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: { color: '#0A0B0D', fontSize: 12, fontWeight: '800' },

  inlineButtons: { flexDirection: 'row', gap: 8, marginTop: 14 },
  smallButton: {
    flex: 1, minHeight: 42, borderRadius: 11, backgroundColor: C.surface2,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border,
  },
  dangerButton: { backgroundColor: '#1A1214', borderColor: '#3A2227' },
  smallButtonText: { color: C.text, fontSize: 10, fontWeight: '700' },

  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 15,
  },
  infoRow: {
    minHeight: 47,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: { color: C.sub, fontSize: 10 },
  infoValue: { color: C.text, fontSize: 10, fontWeight: '650', maxWidth: '60%', textAlign: 'right' },

  memory: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  memoryDate: { color: C.muted, fontSize: 9 },
  memoryText: { color: C.text, fontSize: 12, marginTop: 4, lineHeight: 17 },

  empty: { color: C.muted, fontSize: 11, paddingVertical: 15 },

  reset: { marginTop: 30, paddingVertical: 14, alignItems: 'center' },
  resetText: { color: C.red, fontSize: 11 },

  bottomNav: {
    minHeight: 64,
    flexDirection: 'row',
    backgroundColor: '#0D0F12',
    borderTopWidth: 1,
    borderTopColor: '#191C21',
    paddingTop: 7,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#373B43', marginBottom: 7 },
  navDotActive: { width: 14, backgroundColor: C.accent },
  navLabel: { color: '#565C66', fontSize: 9 },
  navLabelActive: { color: C.text },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#13161B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalTitle: { color: C.text, fontSize: 23, fontWeight: '730', letterSpacing: -0.4 },
  modalText: { color: C.sub, fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 17 },
  modalChoice: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 8,
  },
  modalChoiceText: { color: C.text, fontSize: 12, fontWeight: '600' },

  deathContent: { paddingHorizontal: 22, paddingTop: 55, paddingBottom: 50 },
  deathAge: { color: C.text, fontSize: 76, fontWeight: '750', letterSpacing: -3, marginTop: 20 },
  deathYears: { color: C.sub, fontSize: 16 },
  deathCause: { color: C.sub, fontSize: 12, marginTop: 20, lineHeight: 18 },
});

export default Game;

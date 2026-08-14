import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView,
  StatusBar, Alert, ActivityIndicator, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = '@life_sim_save_v5';

const C = {
  bg:'#080A0D', surface:'#11151A', surface2:'#171C23', border:'#252C35',
  text:'#F5F7FA', sub:'#A0A7B1', muted:'#66707B', green:'#62D698',
  red:'#F0787E', yellow:'#E7BD64', accent:'#8D92FF', blue:'#72A9FF'
};

const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,v));
const money=v=>Number(Math.round(v||0)).toLocaleString('uk-UA');
const MONTHS=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const WEEKDAYS=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const formatDate=d=>`${d.day} ${MONTHS[d.month-1]} ${d.year}`;
const weekdayIndex=d=>new Date(d.year,d.month-1,d.day).getDay();
const weekday=d=>WEEKDAYS[weekdayIndex(d)];
const formatTime=m=>`${String(Math.floor((((m%1440)+1440)%1440)/60)).padStart(2,'0')}:${String((((m%1440)+1440)%1440)%60).padStart(2,'0')}`;
const dim=(m,y)=>new Date(y,m,0).getDate();
const nextDate=d=>{let day=d.day+1,month=d.month,year=d.year;if(day>dim(month,year)){day=1;month++;if(month>12){month=1;year++;}}return{day,month,year};};
const serial=d=>Math.floor(new Date(d.year,d.month-1,d.day).getTime()/86400000);
const uid=p=>`${p}_${Date.now()}_${Math.floor(Math.random()*99999)}`;

const START={
  version:12,date:{day:12,month:8,year:2026},timeMinutes:480,birthday:{day:12,month:8},age:18,alive:true,
  cash:500,bank:0,health:94,energy:86,fatigue:12,satiety:72,mood:74,stress:8,fitness:42,
  intelligence:8,charisma:8,professionalSkill:0,reputation:2,
  hidden:{familyBond:60,socialTrust:50,careerTrust:50,empathy:50,reliability:52,burnout:0,longTermHealth:92,loneliness:10,lifeStress:5,creditTrust:48,financialDiscipline:50,nutritionHistory:65,sleepHistory:70},
  career:{companyId:null,roleId:null,companyMonths:0,roleMonths:0,workDaysMonth:0,workedToday:false,excusedToday:false,attendance:{absences:0,late:0,warnings:0,perfectMonths:0,streak:0}},
  familyMealsToday:0,sideGigDoneToday:{},
  phoneId:'samsung_s3',phoneCondition:55,cars:[],activeCarId:null,housingId:'parents',properties:[],businesses:[],
  debts:[],investmentPortfolio:{marketValue:0,lastMonthReturn:0},
  monthly:{salary:0,business:0,investments:0,housing:0,food:0,transport:0,sideGigs:0,familySupport:0},
  stats:{daysLived:1,totalEarned:0,totalSpent:0,jobsHeld:0,eventsSeen:0,sideGigEarned:0,familySupportValue:0},
  relatives:{mother:{name:'Мама',alive:true,age:43,relationship:75,health:88},father:{name:'Отец',alive:true,age:45,relationship:70,health:84},grandmother:{name:'Бабушка',alive:true,age:66,relationship:66,health:68}},
  memories:[],eventHistory:[],pendingEventId:null,lastEventDay:-10
};

const COMPANIES=[
 {id:'nova',name:'Нова пошта',sector:'Логистика',roles:[
  {id:'np1',name:'Оператор отделения',salary:24000,hours:8,req:{i:6,c:8,s:0,r:0}},
  {id:'np2',name:'Старший оператор',salary:33000,hours:8,min:4,req:{i:12,c:13,s:12,r:5}},
  {id:'np3',name:'Керівник відділення',salary:52000,hours:9,min:12,req:{i:22,c:25,s:28,r:15}},
  {id:'np4',name:'Регіональний менеджер',salary:90000,hours:9,min:30,req:{i:36,c:42,s:52,r:32}}
 ]},
 {id:'rozetka',name:'ROZETKA',sector:'E-commerce',roles:[
  {id:'rz1',name:'Комплектувальник замовлень',salary:26000,hours:8,req:{i:5,c:4,s:0,r:0}},
  {id:'rz2',name:'Специалист поддержки',salary:34000,hours:8,min:3,req:{i:13,c:14,s:8,r:3}},
  {id:'rz3',name:'Менеджер категории',salary:65000,hours:9,min:14,req:{i:28,c:27,s:38,r:18}},
  {id:'rz4',name:'Руководитель направления',salary:125000,hours:10,min:36,req:{i:45,c:48,s:68,r:42}}
 ]},
 {id:'atb',name:'АТБ',sector:'Ритейл',roles:[
  {id:'atb1',name:'Продавец-кассир',salary:23000,hours:8,req:{i:4,c:6,s:0,r:0}},
  {id:'atb2',name:'Администратор магазина',salary:34000,hours:9,min:6,req:{i:15,c:18,s:16,r:6}},
  {id:'atb3',name:'Управляющий магазином',salary:52000,hours:9,min:18,req:{i:25,c:30,s:34,r:18}},
  {id:'atb4',name:'Региональный управляющий',salary:92000,hours:10,min:38,req:{i:40,c:44,s:58,r:38}}
 ]},
 {id:'silpo',name:'Сільпо',sector:'Ритейл',roles:[
  {id:'sp1',name:'Кассир',salary:24000,hours:8,req:{i:4,c:7,s:0,r:0}},
  {id:'sp2',name:'Старший отдела',salary:35000,hours:8,min:6,req:{i:14,c:18,s:18,r:7}},
  {id:'sp3',name:'Управляющий супермаркетом',salary:58000,hours:9,min:20,req:{i:28,c:32,s:40,r:22}}
 ]},
 {id:'kyivstar',name:'Київстар',sector:'Телеком',roles:[
  {id:'ks1',name:'Специалист поддержки',salary:32000,hours:8,phone:20,req:{i:12,c:12,s:4,r:2}},
  {id:'ks2',name:'Менеджер продаж',salary:47000,hours:8,min:6,req:{i:18,c:27,s:18,r:10}},
  {id:'ks3',name:'Team Lead',salary:76000,hours:9,min:20,req:{i:32,c:38,s:45,r:28}},
  {id:'ks4',name:'Руководитель направления',salary:145000,hours:10,min:42,req:{i:50,c:52,s:70,r:45}}
 ]},
 {id:'privat',name:'ПриватБанк',sector:'Банк',roles:[
  {id:'pb1',name:'Специалист клиентского обслуживания',salary:30000,hours:8,phone:15,req:{i:13,c:13,s:5,r:4}},
  {id:'pb2',name:'Финансовый консультант',salary:47000,hours:8,min:8,req:{i:25,c:24,s:23,r:15}},
  {id:'pb3',name:'Руководитель отделения',salary:72000,hours:9,min:24,req:{i:36,c:37,s:48,r:30}},
  {id:'pb4',name:'Региональный руководитель',salary:135000,hours:10,min:48,req:{i:52,c:50,s:72,r:48}}
 ]}
];

const SIDE_GIGS=[
 ['flyers','Раздача листовок',450,3,14,{}],['loader','Грузчик',850,4,28,{fitness:30}],
 ['waiter','Официант на мероприятии',950,6,24,{charisma:8}],['inventory','Ночная инвентаризация',1150,7,26,{}],
 ['warehouse','Смена на складе',1050,6,27,{fitness:25}],['walk_delivery','Пешая доставка',700,4,22,{phone:10}],
 ['car_delivery','Доставка на автомобиле',1550,5,15,{car:true,phone:20}],['taxi','Такси вечером',1900,6,17,{car:true,phone:25}],
 ['moving','Помощь с переездом',1250,5,31,{fitness:38}],['dogs','Выгул собак',520,3,13,{}],
 ['tutor','Частный урок',1200,2,10,{intelligence:30,charisma:16}],['web','Небольшой сайт на фрилансе',3200,6,20,{intelligence:35,phone:30}],
 ['social','Ведение соцсетей бизнеса',2100,4,16,{charisma:28,phone:45}],['photo','Фотосъёмка мероприятия',2600,5,18,{charisma:20,phone:65}],
 ['handyman','Мелкий бытовой ремонт',1750,5,25,{skill:25}]
].map(x=>({id:x[0],name:x[1],pay:x[2],hours:x[3],energy:x[4],req:x[5]}));

const PHONES=[
 ['nokia','Nokia','6300',900,5,1],['samsung_s3','Samsung','Galaxy S III',1800,10,2],['iphone5','Apple','iPhone 5',2600,12,4],
 ['iphone7','Apple','iPhone 7',5200,28,10],['redmi8','Xiaomi','Redmi Note 8',6500,35,7],['iphone11','Apple','iPhone 11',12500,55,23],
 ['s22','Samsung','Galaxy S22',22000,72,35],['iphone13','Apple','iPhone 13 Pro',28500,78,46],['pixel9','Google','Pixel 9 Pro',44000,89,55],
 ['iphone16','Apple','iPhone 16 Pro Max',62000,96,78],['s25','Samsung','Galaxy S25 Ultra',68000,98,80]
].map((x,i)=>({id:x[0],brand:x[1],model:x[2],price:x[3],performance:x[4],prestige:x[5],monthly:80+i*20}));

const CARS=[
 ['lanos','Daewoo','Lanos',90000,52,25,3,4500],['sens','ЗАЗ','Sens',110000,55,27,3,4300],['logan','Renault','Logan',210000,78,38,7,5200],
 ['golf','Volkswagen','Golf VII',390000,72,52,17,6500],['octavia','Skoda','Octavia',610000,80,62,22,7200],['camry','Toyota','Camry',980000,91,74,39,8800],
 ['bmw530','BMW','530d G30',1250000,72,84,58,12500],['e220','Mercedes-Benz','E 220 d',1800000,78,89,67,14800],
 ['model3','Tesla','Model 3',1850000,82,82,62,9000],['m5','BMW','M5',6200000,72,91,91,36000],['911','Porsche','911 Carrera',8500000,86,88,96,46000],
 ['bentley','Bentley','Continental GT',14500000,77,98,99,78000],['ghost','Rolls-Royce','Ghost',23000000,82,100,100,115000]
].map(x=>({id:x[0],brand:x[1],model:x[2],price:x[3],reliability:x[4],comfort:x[5],prestige:x[6],monthly:x[7]}));

const HOUSING=[
 {id:'parents',name:'Жить с родителями',type:'family',price:0,monthly:0,comfort:48},
 {id:'homeless',name:'Без постоянного жилья',type:'none',price:0,monthly:0,comfort:5},
 {id:'room',name:'Комната',type:'rent',price:0,monthly:6500,comfort:42},
 {id:'studio',name:'Студия',type:'rent',price:0,monthly:14500,comfort:60},
 {id:'flat',name:'1-комнатная квартира',type:'buy',price:2200000,monthly:3800,comfort:69},
 {id:'premium',name:'Квартира бизнес-класса',type:'buy',price:5800000,monthly:8500,comfort:88},
 {id:'house',name:'Загородный дом',type:'buy',price:11000000,monthly:18000,comfort:95}
];

const BUSINESSES=[
 ['vending','Вендинговый автомат',65000,380,.32],['instashop','Интернет-магазин',120000,950,.46],['coffee','Кофейный киоск',260000,1700,.46],
 ['tires','Шиномонтаж',520000,3400,.51],['barber','Барбершоп',720000,4300,.58],['beauty','Салон красоты',850000,5200,.59],
 ['wash','Автомойка',950000,6200,.55],['smallsto','Небольшое СТО',1800000,11800,.61],['cafe','Кофейня',1650000,10200,.62],
 ['grocery','Продуктовый магазин',2400000,16000,.71],['delivery','Служба доставки',2900000,18500,.68],['sto','Полноценное СТО',4200000,29000,.63],
 ['restaurant','Ресторан',6500000,38000,.70],['dealer','Автосалон подержанных авто',11500000,72000,.78],['logistics','Логистическая компания',18500000,125000,.81]
].map(x=>({id:x[0],name:x[1],price:x[2],daily:x[3],expenseRate:x[4]}));


const EVENTS={
 family_dinner:{id:'family_dinner',cat:'Семья',title:'Семейный ужин',text:'Мама приглашает приехать вечером. Последнее время вы виделись нечасто.',cond:g=>g.relatives.mother?.alive,choices:[
  {label:'Приехать',direct:{time:180,energy:-7},hidden:{familyBond:6,mood:7},memory:'Приехал на семейный ужин'},
  {label:'Сказать, что занят',direct:{},hidden:{familyBond:-3,reliability:-1},memory:'Отказался от семейного ужина'},
  {label:'Не отвечать',direct:{},hidden:{familyBond:-7,loneliness:2},memory:'Не ответил семье'}
 ]},
 mother_help:{id:'mother_help',cat:'Семья',title:'Маме нужна помощь',text:'Мама просит помочь с покупками и домашними делами.',cond:g=>g.relatives.mother?.alive,choices:[
  {label:'Помочь',direct:{time:150,energy:-9},hidden:{familyBond:7,empathy:3,mood:2},memory:'Помог маме с домашними делами'},
  {label:'Заказать доставку',direct:{cash:-550},hidden:{familyBond:3,empathy:1},memory:'Оплатил доставку для мамы'},
  {label:'Отказать',direct:{},hidden:{familyBond:-5},memory:'Отказал маме в помощи'}
 ]},
 grandmother_medicine:{id:'grandmother_medicine',cat:'Семья',title:'Лекарства для бабушки',text:'Бабушке нужно купить лекарства. В семье обсуждают, кто сможет помочь.',cond:g=>g.relatives.grandmother?.alive,choices:[
  {label:'Купить лекарства',direct:{cash:-1800,time:60},hidden:{familyBond:6,empathy:5},memory:'Купил лекарства бабушке'},
  {label:'Скинуться частично',direct:{cash:-700},hidden:{familyBond:3,empathy:2},memory:'Частично помог с лекарствами бабушке'},
  {label:'Не участвовать',direct:{},hidden:{familyBond:-4,empathy:-2},memory:'Не участвовал в покупке лекарств бабушке'}
 ]},
 coworker_funeral:{id:'coworker_funeral',cat:'Работа',title:'Сбор на похороны коллеги',text:'Умер сотрудник компании, который занимал должность выше вашей. Коллеги собирают деньги семье.',cond:g=>!!g.career.companyId,choices:[
  {label:'Передать 2 000 ₴',direct:{cash:-2000},hidden:{careerTrust:5,empathy:4,socialTrust:3},memory:'Помог семье умершего коллеги'},
  {label:'Передать 5 000 ₴',direct:{cash:-5000},hidden:{careerTrust:8,empathy:7,socialTrust:5},memory:'Щедро помог семье умершего коллеги'},
  {label:'Только выразить соболезнования',direct:{},hidden:{empathy:1},memory:'Выразил соболезнования коллегам'},
  {label:'Ничего не делать',direct:{},hidden:{careerTrust:-7,socialTrust:-5,empathy:-3},memory:'Не участвовал в помощи семье коллеги'}
 ]},
 colleague_shift:{id:'colleague_shift',cat:'Работа',title:'Коллега просит подменить',text:'Коллега просит выйти вместо него в ваш выходной.',cond:g=>!!g.career.companyId,choices:[
  {label:'Согласиться',direct:{time:480,energy:-24},hidden:{socialTrust:6,careerTrust:2,stress:4},memory:'Подменил коллегу в выходной'},
  {label:'Отказать',direct:{},hidden:{socialTrust:-1},memory:'Отказался подменять коллегу'}
 ]},
 boss_overtime:{id:'boss_overtime',cat:'Работа',title:'Начальник просит задержаться',text:'Перед важным дедлайном начальник просит остаться ещё на несколько часов.',cond:g=>!!g.career.companyId,choices:[
  {label:'Остаться',direct:{time:180,energy:-12},hidden:{careerTrust:5,burnout:3,stress:5},memory:'Остался работать сверхурочно'},
  {label:'Отказаться',direct:{},hidden:{careerTrust:-2,stress:-1},memory:'Отказался от сверхурочной работы'}
 ]},
 absence:{id:'absence',cat:'Работа',title:'Разговор после прогула',text:'Руководитель хочет понять, почему вы не вышли на обязательную смену.',cond:g=>!!g.career.companyId,choices:[
  {label:'Честно признать ошибку',direct:{},hidden:{reliability:1,careerTrust:-2},memory:'Признал ошибку после прогула'},
  {label:'Сказать, что заболел',direct:{},hidden:{reliability:-3,careerTrust:-1},memory:'Сослался на болезнь после прогула'},
  {label:'Сослаться на семью',direct:{},hidden:{careerTrust:-1},memory:'Объяснил прогул семейными обстоятельствами'},
  {label:'Не объяснять',direct:{},hidden:{reliability:-5,careerTrust:-6},memory:'Отказался объяснять прогул'}
 ]},
 client_praise:{id:'client_praise',cat:'Работа',title:'Похвала клиента',text:'Клиент отдельно отметил вашу работу и написал благодарность компании.',cond:g=>!!g.career.companyId,choices:[
  {label:'Принять как рабочий момент',direct:{},hidden:{careerTrust:3,reputation:2,mood:3},memory:'Получил благодарность клиента'},
  {label:'Попросить начальника учесть отзыв',direct:{},hidden:{careerTrust:2,charisma:.4,stress:1},memory:'Использовал отзыв клиента в разговоре о карьере'}
 ]},
 friend_help:{id:'friend_help',cat:'Социальное',title:'Друг просит денег',text:'Знакомый оказался в сложной ситуации и просит одолжить 10 000 ₴.',cond:()=>true,choices:[
  {label:'Одолжить 10 000 ₴',direct:{cash:-10000},hidden:{socialTrust:6,empathy:5},memory:'Одолжил деньги знакомому'},
  {label:'Дать 3 000 ₴ без возврата',direct:{cash:-3000},hidden:{socialTrust:4,empathy:7},memory:'Безвозмездно помог знакомому'},
  {label:'Отказать',direct:{},hidden:{empathy:-1},memory:'Отказал знакомому в финансовой помощи'}
 ]},
 old_friend:{id:'old_friend',cat:'Социальное',title:'Сообщение от старого знакомого',text:'Человек, с которым вы давно не общались, предлагает встретиться.',cond:()=>true,choices:[
  {label:'Встретиться',direct:{time:150,cash:-350,energy:-6},hidden:{socialTrust:4,charisma:.3,mood:5,loneliness:-4},memory:'Встретился со старым знакомым'},
  {label:'Перенести встречу',direct:{},hidden:{socialTrust:-1},memory:'Перенёс встречу со знакомым'},
  {label:'Игнорировать',direct:{},hidden:{socialTrust:-3,loneliness:2},memory:'Проигнорировал старого знакомого'}
 ]},
 networking:{id:'networking',cat:'Социальное',title:'Деловая встреча',text:'Знакомый зовёт на небольшое профессиональное мероприятие.',cond:g=>g.charisma>=10,choices:[
  {label:'Пойти',direct:{cash:-650,time:180,energy:-8},hidden:{charisma:.5,socialTrust:3,careerTrust:1},memory:'Посетил профессиональное мероприятие'},
  {label:'Не идти',direct:{},hidden:{},memory:'Пропустил профессиональное мероприятие'}
 ]},
 health:{id:'health',cat:'Здоровье',title:'Самочувствие ухудшилось',text:'Последние дни вы быстро устаёте и хуже концентрируетесь.',cond:g=>g.health<78||g.fatigue>62||g.stress>65,choices:[
  {label:'Записаться к врачу',direct:{cash:-1500,time:120},hidden:{health:4,stress:-4,longTermHealth:2},memory:'Обратился к врачу при первых симптомах'},
  {label:'Взять день отдыха',direct:{time:480},hidden:{energy:18,fatigue:-20,stress:-8,mood:4},memory:'Взял день отдыха из-за самочувствия'},
  {label:'Игнорировать',direct:{},hidden:{health:-3,fatigue:7,stress:4,longTermHealth:-2},memory:'Проигнорировал ухудшение здоровья'}
 ]},
 dental:{id:'dental',cat:'Здоровье',title:'Заболел зуб',text:'Боль пока терпимая, но сама проблема вряд ли исчезнет.',cond:()=>true,choices:[
  {label:'Пойти к стоматологу',direct:{cash:-3200,time:150},hidden:{health:2,stress:-3},memory:'Вовремя сходил к стоматологу'},
  {label:'Купить обезболивающее',direct:{cash:-240},hidden:{health:-.5,stress:-1},memory:'Отложил лечение зуба'},
  {label:'Терпеть',direct:{},hidden:{health:-2,stress:4,mood:-4},memory:'Игнорировал зубную боль'}
 ]},
 phone_break:{id:'phone_break',cat:'Имущество',title:'Телефон начал сбоить',text:'Телефон выключается и иногда не принимает звонки.',cond:g=>!!g.phoneId&&g.phoneCondition<55,choices:[
  {label:'Ремонт',direct:{cash:-1200,time:90},special:'repair_phone',memory:'Отремонтировал телефон'},
  {label:'Пока пользоваться так',direct:{},hidden:{stress:2},memory:'Отложил ремонт телефона'}
 ]},
 car_break:{id:'car_break',cat:'Автомобиль',title:'Проблема с автомобилем',text:'Во время поездки появился посторонний звук.',cond:g=>!!g.activeCarId,choices:[
  {label:'Диагностика и ремонт',direct:{cash:-6500,time:180},special:'repair_car',memory:'Сразу отремонтировал автомобиль'},
  {label:'Продолжить ездить',direct:{},hidden:{stress:2},special:'damage_car',memory:'Продолжил ездить с неисправностью'}
 ]},
 fine:{id:'fine',cat:'Автомобиль',title:'Штраф за парковку',text:'После поездки вы обнаружили постановление о штрафе.',cond:g=>!!g.activeCarId,choices:[
  {label:'Оплатить',direct:{cash:-680},hidden:{financialDiscipline:1},memory:'Оплатил штраф за парковку'},
  {label:'Отложить',direct:{},hidden:{financialDiscipline:-2,stress:2},memory:'Отложил оплату штрафа'}
 ]},
 rent:{id:'rent',cat:'Жильё',title:'Повышение аренды',text:'Арендодатель сообщает, что со следующего месяца цена будет выше.',cond:g=>['room','studio'].includes(g.housingId),choices:[
  {label:'Согласиться',direct:{},hidden:{stress:2},memory:'Принял повышение аренды'},
  {label:'Попробовать договориться',direct:{time:45,energy:-2},hidden:{charisma:.2},memory:'Торговался с арендодателем'},
  {label:'Съехать к родителям',direct:{},special:'parents',memory:'Решил съехать с аренды'}
 ]},
 business_break:{id:'business_break',cat:'Бизнес',title:'Сломалось оборудование',text:'В одном из ваших бизнесов оборудование требует ремонта.',cond:g=>g.businesses.length>0,choices:[
  {label:'Нормальный ремонт',direct:{cash:-12000},special:'biz_good',memory:'Оплатил нормальный ремонт бизнеса'},
  {label:'Дешёвый ремонт',direct:{cash:-4500},special:'biz_cheap',memory:'Сэкономил на ремонте бизнеса'},
  {label:'Отложить',direct:{},special:'biz_bad',hidden:{stress:4},memory:'Отложил ремонт оборудования'}
 ]},
 employee:{id:'employee',cat:'Бизнес',title:'Сотрудник просит повышение',text:'Один из ключевых сотрудников считает, что его зарплата не соответствует нагрузке.',cond:g=>g.businesses.length>0,choices:[
  {label:'Повысить зарплату',direct:{cash:-5000},hidden:{socialTrust:3},memory:'Повысил зарплату сотруднику'},
  {label:'Обсудить через месяц',direct:{time:60},hidden:{charisma:.2,socialTrust:1},memory:'Отложил разговор о зарплате сотрудника'},
  {label:'Отказать',direct:{},hidden:{socialTrust:-3},memory:'Отказал сотруднику в повышении'}
 ]},
 food:{id:'food',cat:'Здоровье',title:'Питание даёт о себе знать',text:'Организм всё хуже переносит нерегулярное и дешёвое питание.',cond:g=>g.hidden.nutritionHistory<38,choices:[
  {label:'Улучшить питание',direct:{cash:-800},hidden:{nutritionHistory:6,health:2,mood:2},memory:'Решил улучшить питание'},
  {label:'Ничего не менять',direct:{},hidden:{health:-2,stress:2},memory:'Не стал менять плохое питание'}
 ]},
 referral:{id:'referral',cat:'Карьера',title:'Неожиданная рекомендация',text:'Знакомый услышал о вакансии и готов порекомендовать вас.',cond:g=>g.hidden.socialTrust>58,choices:[
  {label:'Попросить познакомить',direct:{time:60},hidden:{reputation:2,careerTrust:2},memory:'Использовал рекомендацию знакомого'},
  {label:'Не менять планы',direct:{},hidden:{},memory:'Отказался от карьерной рекомендации'}
 ]}
};

const companyById=id=>COMPANIES.find(x=>x.id===id)||null;
const roleByIds=(cid,rid)=>companyById(cid)?.roles.find(x=>x.id===rid)||null;
const phoneById=id=>PHONES.find(x=>x.id===id)||null;
const carById=id=>CARS.find(x=>x.id===id)||null;
const housingById=id=>HOUSING.find(x=>x.id===id)||HOUSING[0];
const activeCarState=g=>g.cars.find(x=>x.uid===g.activeCarId)||null;
const activeCarBase=g=>{const a=activeCarState(g);return a?carById(a.catalogId):null;};
const phonePerf=g=>{const p=phoneById(g.phoneId);return p?p.performance*(g.phoneCondition/100):0;};
const scheduled=g=>!!g.career.companyId&&[1,2,3,4,5].includes(weekdayIndex(g.date));
const directText=d=>{const a=[];if(d?.cash)a.push(`${d.cash<0?'−':'+'}${money(Math.abs(d.cash))} ₴`);if(d?.energy)a.push(`${d.energy<0?'−':'+'}${Math.abs(d.energy)} энергии`);if(d?.time)a.push(d.time>=60?`${(d.time/60).toFixed(d.time%60?1:0)} ч`:`${d.time} мин`);return a.length?a.join(' · '):'Без прямых затрат';};

function mergeSave(s){
 if(!s)return START;
 const g={...START,...s,hidden:{...START.hidden,...(s.hidden||{})},career:{...START.career,...(s.career||{}),attendance:{...START.career.attendance,...(s.career?.attendance||{})}},monthly:{...START.monthly,...(s.monthly||{})},stats:{...START.stats,...(s.stats||{})},relatives:{...START.relatives,...(s.relatives||{})},investmentPortfolio:{...START.investmentPortfolio,...(s.investmentPortfolio||{})}};
 if(!g.career.companyId&&s.jobId){const m={courier:['nova','np1'],seller:['atb','atb1'],operator:['kyivstar','ks1'],sales_manager:['rozetka','rz3'],senior_manager:['rozetka','rz4'],director:['rozetka','rz4']}[s.jobId];if(m){g.career.companyId=m[0];g.career.roleId=m[1];}}
 if(!s.investmentPortfolio&&typeof s.investments==='number')g.investmentPortfolio={marketValue:s.investments,lastMonthReturn:0};
 return g;
}

function apply(g,c={}){
 const h={...g.hidden};
 Object.keys(h).forEach(k=>{if(typeof c[k]==='number')h[k]=clamp(h[k]+c[k]);});
 return {...g,health:clamp(g.health+(c.health||0)),energy:clamp(g.energy+(c.energy||0)),fatigue:clamp(g.fatigue+(c.fatigue||0)),satiety:clamp(g.satiety+(c.satiety||0)),mood:clamp(g.mood+(c.mood||0)),stress:clamp(g.stress+(c.stress||0)),intelligence:clamp(g.intelligence+(c.intelligence||0)),charisma:clamp(g.charisma+(c.charisma||0)),professionalSkill:clamp(g.professionalSkill+(c.skill||0)),reputation:clamp(g.reputation+(c.reputation||0)),hidden:h};
}

function commute(g){
 const s=activeCarState(g),b=activeCarBase(g);
 if(s&&b&&s.condition>20)return{type:'car',minutes:Math.max(20,42-Math.round(b.comfort/5)+(s.condition<45?12:0)),cash:Math.round(120+b.monthly/120),energy:Math.max(1,7-Math.round(b.comfort/25)),stress:s.condition<45?3:Math.max(0,3-Math.round(b.comfort/40))};
 return{type:'public',minutes:70,cash:60,energy:7,stress:4};
}

function worth(g){
 const cars=g.cars.reduce((s,o)=>{const b=carById(o.catalogId);return s+(b?b.price*(o.condition/100)*.7:0);},0);
 const props=g.properties.reduce((s,o)=>s+(housingById(o.catalogId)?.price||0),0);
 const biz=g.businesses.reduce((s,o)=>{const b=BUSINESSES.find(x=>x.id===o.catalogId);return s+(b?b.price*((o.condition||100)/100)*.75:0);},0);
 const p=phoneById(g.phoneId);const pv=p?p.price*(g.phoneCondition/100)*.28:0;
 const debt=g.debts.filter(x=>x.status==='active').reduce((s,x)=>s+x.balance,0);
 return Math.round(g.cash+g.bank+cars+props+biz+(g.investmentPortfolio.marketValue||0)+pv-debt);
}

function App(){
 const [game,setGame]=useState(START),[screen,setScreen]=useState('today'),[loaded,setLoaded]=useState(false),[sleepOpen,setSleepOpen]=useState(false),[eventOpen,setEventOpen]=useState(false),[marketTab,setMarketTab]=useState('phones');
 const timer=useRef(null);

 useEffect(()=>{(async()=>{try{const raw=await AsyncStorage.getItem(SAVE_KEY);if(raw){const g=mergeSave(JSON.parse(raw));setGame(g);if(g.pendingEventId)setEventOpen(true);}}catch(e){console.log(e);}finally{setLoaded(true);}})();},[]);
 useEffect(()=>{if(!loaded)return;if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>AsyncStorage.setItem(SAVE_KEY,JSON.stringify(game)).catch(console.log),250);return()=>timer.current&&clearTimeout(timer.current);},[game,loaded]);
 useEffect(()=>{if(game.pendingEventId)setEventOpen(true);},[game.pendingEventId]);

 const company=useMemo(()=>companyById(game.career.companyId),[game.career.companyId]);
 const role=useMemo(()=>roleByIds(game.career.companyId,game.career.roleId),[game.career.companyId,game.career.roleId]);
 const phone=useMemo(()=>phoneById(game.phoneId),[game.phoneId]);
 const housing=useMemo(()=>housingById(game.housingId),[game.housingId]);
 const capital=useMemo(()=>worth(game),[game]);

 const patch=fn=>setGame(g=>typeof fn==='function'?fn(g):({...g,...fn}));

 const eventify=(g,force=false)=>{
  if(g.pendingEventId)return g;
  const gap=g.stats.daysLived-g.lastEventDay;
  if(!force&&gap<2)return g;
  if(!force&&Math.random()>.18)return g;
  const recent=new Set((g.eventHistory||[]).slice(-6));
  let pool=Object.values(EVENTS).filter(e=>{try{return e.cond(g)&&!recent.has(e.id);}catch{return false;}});
  if(!pool.length)pool=Object.values(EVENTS).filter(e=>{try{return e.cond(g);}catch{return false;}});
  if(!pool.length)return g;
  const e=pool[Math.floor(Math.random()*pool.length)];
  return {...g,pendingEventId:e.id,lastEventDay:g.stats.daysLived,eventHistory:[...(g.eventHistory||[]),e.id].slice(-30),stats:{...g.stats,eventsSeen:g.stats.eventsSeen+1}};
 };

 const processDebts=g=>{
  const today=serial(g.date);let ng={...g};
  ng.debts=g.debts.map(d=>{if(d.status!=='active')return d;let x={...d};if(x.kind==='micro'){const i=Math.round(x.balance*(x.dailyRate||.012));x.balance+=i;}if(today>x.dueSerial&&!x.lateMarked){x.lateMarked=true;ng=apply(ng,{creditTrust:-7,financialDiscipline:-6,stress:5,familyBond:x.lender==='mother'?-5:0,careerTrust:x.lender==='coworker'?-5:0});}return x;});
  return ng;
 };

 const processMonth=g=>{
  let ng={...g};const r=roleByIds(g.career.companyId,g.career.roleId),h=housingById(g.housingId),car=activeCarBase(g),p=phoneById(g.phoneId);
  let salary=0,biz=0,inv=0,expenses=0;
  if(r&&g.career.workDaysMonth>0){salary=Math.round(r.salary*Math.min(1,g.career.workDaysMonth/21));ng.cash+=salary;}
  ng.businesses=g.businesses.map(o=>{const b=BUSINESSES.find(x=>x.id===o.catalogId);if(!b)return o;const net=Math.round(b.daily*30*(.88+Math.random()*.24)*(1-b.expenseRate)*((o.condition||100)/100));biz+=net;return{...o,lastMonthProfit:net,condition:clamp((o.condition||100)-.7,25,100)};});
  ng.cash+=biz;
  if(g.investmentPortfolio.marketValue>0){inv=Math.round(g.investmentPortfolio.marketValue*((Math.random()*.10)-.035));ng.investmentPortfolio={...g.investmentPortfolio,marketValue:Math.max(0,g.investmentPortfolio.marketValue+inv),lastMonthReturn:inv};}
  if(h.type==='family'){const contribution=r?Math.min(6000,Math.round(r.salary*.08)):0;expenses+=contribution;ng.stats={...ng.stats,familySupportValue:ng.stats.familySupportValue+Math.max(0,5000-contribution)};}else expenses+=h.monthly;
  if(car)expenses+=car.monthly;if(p)expenses+=p.monthly;ng.cash-=expenses;
  ng.career={...ng.career,companyMonths:r?ng.career.companyMonths+1:0,roleMonths:r?ng.career.roleMonths+1:0,workDaysMonth:0,attendance:{...ng.career.attendance,perfectMonths:ng.career.attendance.perfectMonths+(r&&ng.career.attendance.absences===0?1:0)}};
  ng.monthly={...ng.monthly,salary,business:biz,investments:inv,housing:h.type==='family'?0:h.monthly,transport:car?car.monthly:0};
  ng.stats={...ng.stats,totalEarned:ng.stats.totalEarned+salary+biz+Math.max(0,inv),totalSpent:ng.stats.totalSpent+expenses};
  return ng;
 };

 const absence=g=>{
  if(!scheduled(g)||g.career.workedToday||g.career.excusedToday)return g;
  let ng={...g,career:{...g.career,attendance:{...g.career.attendance,absences:g.career.attendance.absences+1,warnings:g.career.attendance.warnings+(g.career.attendance.absences>=1?1:0),streak:0}}};
  ng=apply(ng,{careerTrust:-6,reliability:-5,reputation:-1,stress:3});
  ng.memories=[...ng.memories,{date:formatDate(g.date),age:g.age,text:'Не вышел на обязательную рабочую смену'}].slice(-100);
  if(!ng.pendingEventId)ng={...ng,pendingEventId:'absence',lastEventDay:ng.stats.daysLived,stats:{...ng.stats,eventsSeen:ng.stats.eventsSeen+1}};
  if(ng.career.attendance.absences>=4){const c=companyById(ng.career.companyId);ng.memories=[...ng.memories,{date:formatDate(g.date),age:g.age,text:`Уволен из ${c?.name||'компании'} за систематические невыходы`}].slice(-100);ng.career={...START.career,attendance:{...START.career.attendance,absences:ng.career.attendance.absences,warnings:ng.career.attendance.warnings}};ng=apply(ng,{careerTrust:-10,reputation:-4});}
  return ng;
 };

 const mortality=g=>{
  if(!g.alive||g.age<45)return g;
  const quality=g.health*.35+g.hidden.longTermHealth*.35+g.fitness*.15+(100-g.hidden.lifeStress)*.15;
  let annual=.002;
  if(g.age>=55)annual+=(g.age-54)*.0011;
  if(g.age>=70)annual+=(g.age-69)*.0032;
  if(g.age>=82)annual+=(g.age-81)*.012;
  annual*=Math.max(.45,1.8-quality/100);
  if(g.health<30)annual*=2.6;
  if(g.hidden.longTermHealth<35)annual*=2.0;
  if(Math.random()<annual/365){
    return {...g,alive:false,causeOfDeath:(g.health<30||g.hidden.longTermHealth<40)?'осложнения, связанные с состоянием здоровья':'естественные причины'};
  }
  return g;
 };

 const newDay=g=>{
  let ng=absence(g),nd=nextDate(ng.date),age=ng.age;if(nd.day===ng.birthday.day&&nd.month===ng.birthday.month)age++;
  ng={...ng,date:nd,age,familyMealsToday:0,sideGigDoneToday:{},career:{...ng.career,workedToday:false,excusedToday:false},stats:{...ng.stats,daysLived:ng.stats.daysLived+1},phoneCondition:ng.phoneId?clamp(ng.phoneCondition-.015):0};
  if(ng.satiety<20)ng=apply(ng,{health:-.7,longTermHealth:-.18,nutritionHistory:-.3});
  if(ng.fatigue>78)ng=apply(ng,{health:-.35,longTermHealth:-.12,burnout:.25});
  if(ng.stress>78)ng=apply(ng,{health:-.25,lifeStress:.22,burnout:.2});
  ng=processDebts(ng);if(nd.day===1)ng=processMonth(ng);ng=mortality(ng);return ng.alive?eventify(ng):ng;
 };

 const advance=(g,minutes)=>{
  let ng={...g},left=minutes;
  while(left>0){const till=1440-ng.timeMinutes,s=Math.min(left,till),hours=s/60;ng=apply(ng,{satiety:-hours*1.45,fatigue:hours*.6,energy:-hours*.38});if(ng.satiety<30)ng=apply(ng,{energy:-hours*.7,mood:-hours*.3,stress:hours*.25});if(ng.satiety<12)ng=apply(ng,{health:-hours*.24,longTermHealth:-hours*.035,nutritionHistory:-hours*.08});ng.timeMinutes+=s;left-=s;if(ng.timeMinutes>=1440){ng.timeMinutes=0;ng=newDay(ng);}if(ng.pendingEventId&&left>0)break;}
  return ng;
 };

 const workPure=g=>{
  const r=roleByIds(g.career.companyId,g.career.roleId);if(!r)return g;const tr=commute(g),need=22+tr.energy*2;
  if(g.energy<need||g.fatigue>91||g.satiety<10)return g;
  let ng={...g,cash:g.cash-tr.cash*2,career:{...g.career,workedToday:true,workDaysMonth:g.career.workDaysMonth+1,attendance:{...g.career.attendance,streak:g.career.attendance.streak+1}}};
  ng=apply(ng,{energy:-need,fatigue:18,satiety:-12,stress:8+tr.stress,skill:.35*(g.fatigue>70?.6:1)*(phonePerf(g)<15?.8:1),charisma:['Ритейл','Телеком','Банк'].includes(companyById(g.career.companyId)?.sector)?.04:.015,reputation:.08,careerTrust:.12});
  const cs=activeCarState(ng),cb=activeCarBase(ng);if(cs&&cb){ng.cars=ng.cars.map(c=>c.uid===cs.uid?{...c,mileage:(c.mileage||0)+34,condition:clamp(c.condition-.02,15,100)}:c);const risk=((100-cb.reliability)/100)*((100-cs.condition)/100)*.08;if(!ng.pendingEventId&&Math.random()<risk)ng.pendingEventId='car_break';}
  if(ng.phoneId&&ng.phoneCondition<35&&!ng.pendingEventId&&Math.random()<.035)ng.pendingEventId='phone_break';
  return advance(ng,r.hours*60+tr.minutes*2);
 };

 const doWork=()=>{if(!role)return Alert.alert('Работа','Сначала выбери компанию и должность.');if(!scheduled(game))return Alert.alert('Выходной','Сегодня по графику нет смены.');if(game.career.workedToday)return Alert.alert('Работа','Смена уже отработана.');if(game.energy<30||game.satiety<10)return Alert.alert('Не хватает сил','Сначала поешь или отдохни.');patch(workPure);};

 const eat=k=>{const o={cheap:[120,29,0,-.15,25],normal:[280,46,2,.12,40],good:[650,58,5,.3,60]}[k];if(game.cash<o[0])return Alert.alert('Недостаточно денег');patch(g=>advance(apply({...g,cash:g.cash-o[0],monthly:{...g.monthly,food:g.monthly.food+o[0]},stats:{...g.stats,totalSpent:g.stats.totalSpent+o[0]}},{satiety:o[1],mood:o[2],nutritionHistory:o[3]}),o[4]));};

 const eatHome=()=>{if(game.housingId!=='parents')return;const max=game.relatives.mother?.relationship>=65?3:2;if(game.familyMealsToday>=max)return Alert.alert('На сегодня хватит');patch(g=>advance(apply({...g,familyMealsToday:g.familyMealsToday+1,stats:{...g.stats,familySupportValue:g.stats.familySupportValue+250}},{satiety:48,mood:2,familyBond:.3,nutritionHistory:.1}),40));};

 const sleep=h=>patch(g=>{const comfort=housingById(g.housingId).comfort/100,q=(h>=7&&h<=9?1:h>=6?.78:.55)*(.72+comfort*.35);return advance(apply(g,{energy:82*q,fatigue:-72*q,mood:h>=7?2:-3,stress:-9*q,health:h>=7?.3:-.3,longTermHealth:h>=7?.09:-.14,sleepHistory:h>=7&&h<=9?.15:-.18}),h*60);});

 const study=()=>{if(game.energy<20||game.satiety<12)return Alert.alert('Не хватает сил');patch(g=>advance(apply(g,{energy:-18,fatigue:11,intelligence:.6,stress:2}),120));};
 const workout=()=>{if(game.energy<24||game.satiety<18)return Alert.alert('Не хватает сил');patch(g=>{let n=advance(apply(g,{energy:-22,fatigue:15,satiety:-8,health:.25,stress:-4,mood:3}),90);n.fitness=clamp(n.fitness+.8);return n;});};

 const gigOK=x=>{const r=x.req||{};return(!r.fitness||game.fitness>=r.fitness)&&(!r.intelligence||game.intelligence>=r.intelligence)&&(!r.charisma||game.charisma>=r.charisma)&&(!r.skill||game.professionalSkill>=r.skill)&&(!r.car||!!activeCarState(game))&&(!r.phone||phonePerf(game)>=r.phone);};
 const doGig=x=>{if(!gigOK(x)||game.sideGigDoneToday[x.id])return;if(game.energy<x.energy||game.satiety<10)return Alert.alert('Не хватает сил');const pay=Math.round(x.pay*(.94+Math.random()*.12));patch(g=>advance(apply({...g,cash:g.cash+pay,sideGigDoneToday:{...g.sideGigDoneToday,[x.id]:true},monthly:{...g.monthly,sideGigs:g.monthly.sideGigs+pay},stats:{...g.stats,totalEarned:g.stats.totalEarned+pay,sideGigEarned:g.stats.sideGigEarned+pay}},{energy:-x.energy,fatigue:x.energy*.7,satiety:-x.hours*2,stress:1,charisma:['waiter','taxi','social'].includes(x.id)?.08:0,skill:['web','handyman','social'].includes(x.id)?.15:0}),x.hours*60));};

 const roleOK=(c,r)=>game.intelligence>=(r.req.i||0)&&game.charisma>=(r.req.c||0)&&game.professionalSkill>=(r.req.s||0)&&game.reputation>=(r.req.r||0)&&game.career.companyMonths>=(r.min||0)&&phonePerf(game)>=(r.phone||0);
 const join=(c,r)=>{const same=game.career.companyId===c.id;if(!same&&r.min)return Alert.alert('Внутренняя должность','Сначала устройся в эту компанию.');if(!roleOK(c,r))return Alert.alert('Требования не выполнены');patch(g=>({...g,career:{...g.career,companyId:c.id,roleId:r.id,companyMonths:same?g.career.companyMonths:0,roleMonths:0,workDaysMonth:0,workedToday:false,attendance:same?g.career.attendance:{...START.career.attendance}},stats:{...g.stats,jobsHeld:g.stats.jobsHeld+1},memories:[...g.memories,{date:formatDate(g.date),age:g.age,text:`${same?'Перешёл на должность':'Устроился'} ${r.name} в ${c.name}`}].slice(-100)}));};

 const quit=()=>patch(g=>({...g,career:{...START.career},memories:[...g.memories,{date:formatDate(g.date),age:g.age,text:`Уволился из ${company?.name||'компании'}`}].slice(-100)}));

 const buyPhone=p=>{if(game.cash<p.price)return Alert.alert('Недостаточно денег');patch(g=>({...g,cash:g.cash-p.price,phoneId:p.id,phoneCondition:100}));};
 const sellPhone=()=>{if(!phone)return;const v=Math.max(100,Math.round(phone.price*(game.phoneCondition/100)*.32));patch(g=>({...g,cash:g.cash+v,phoneId:null,phoneCondition:0}));};
 const buyCar=c=>{if(game.cash<c.price)return Alert.alert('Недостаточно денег');patch(g=>{const id=uid('car');return{...g,cash:g.cash-c.price,cars:[...g.cars,{uid:id,catalogId:c.id,condition:100,mileage:0}],activeCarId:g.activeCarId||id};});};
 const sellCar=o=>{const b=carById(o.catalogId);if(!b)return;const v=Math.round(b.price*(o.condition/100)*.67);patch(g=>({...g,cash:g.cash+v,cars:g.cars.filter(x=>x.uid!==o.uid),activeCarId:g.activeCarId===o.uid?null:g.activeCarId}));};

 const chooseHousing=h=>{if(h.type==='family')return patch({housingId:'parents'});if(h.type==='rent')return patch({housingId:h.id});const owns=game.properties.some(p=>p.catalogId===h.id);if(owns)return patch({housingId:h.id});if(game.cash<h.price)return Alert.alert('Недостаточно денег');patch(g=>({...g,cash:g.cash-h.price,housingId:h.id,properties:[...g.properties,{uid:uid('prop'),catalogId:h.id,condition:100}]}));};
 const sellProp=o=>{const h=housingById(o.catalogId),v=Math.round(h.price*((o.condition||100)/100)*.88);patch(g=>({...g,cash:g.cash+v,properties:g.properties.filter(x=>x.uid!==o.uid),housingId:g.housingId===o.catalogId?(g.relatives.mother?.alive?'parents':'homeless'):g.housingId}));};
 const buyBiz=b=>{if(game.cash<b.price)return Alert.alert('Недостаточно денег');patch(g=>({...g,cash:g.cash-b.price,businesses:[...g.businesses,{uid:uid('biz'),catalogId:b.id,condition:100,lastMonthProfit:0}]}));};
 const sellBiz=o=>{const b=BUSINESSES.find(x=>x.id===o.catalogId);if(!b)return;const v=Math.round(b.price*((o.condition||100)/100)*.68);patch(g=>({...g,cash:g.cash+v,businesses:g.businesses.filter(x=>x.uid!==o.uid)}));};

 const borrow=(kind,amount)=>{const today=serial(game.date);if(kind==='mother'){if(!game.relatives.mother?.alive||game.relatives.mother.relationship<35)return Alert.alert('Мама не готова дать деньги');if(game.debts.some(d=>d.status==='active'&&d.lender==='mother'))return Alert.alert('Сначала верни старый долг');const max=Math.round(3000+game.relatives.mother.relationship*180);if(amount>max)return Alert.alert('Слишком большая сумма',`Лимит около ${money(max)} ₴`);patch(g=>({...g,cash:g.cash+amount,debts:[...g.debts,{uid:uid('debt'),kind:'social',lender:'mother',title:'Долг маме',balance:amount,dueSerial:today+60,status:'active'}]}));}
  if(kind==='bank'){const max=Math.max(10000,Math.round((role?.salary||10000)*(2+game.hidden.creditTrust/35)));if(amount>max||game.hidden.creditTrust<32)return Alert.alert('Банк отказал');const total=Math.round(amount*(1+.19*180/365));patch(g=>({...g,cash:g.cash+amount,debts:[...g.debts,{uid:uid('debt'),kind:'bank',lender:'bank',title:'Банковский кредит',balance:total,dueSerial:today+180,status:'active'}]}));}
  if(kind==='micro'){if(amount>20000)return Alert.alert('Лимит МФО 20 000 ₴');patch(g=>({...g,cash:g.cash+amount,debts:[...g.debts,{uid:uid('debt'),kind:'micro',lender:'mfo',title:'Микрозайм',balance:amount,dueSerial:today+14,status:'active',dailyRate:.012}]}));}
 };
 const repay=(d,a)=>{const pay=Math.min(a,d.balance,game.cash);if(pay<=0)return;patch(g=>({...g,cash:g.cash-pay,debts:g.debts.map(x=>x.uid===d.uid?{...x,balance:Math.max(0,x.balance-pay),status:x.balance-pay<=0?'closed':'active'}:x)}));};
 const invest=a=>{if(game.cash<a)return Alert.alert('Недостаточно денег');patch(g=>({...g,cash:g.cash-a,investmentPortfolio:{...g.investmentPortfolio,marketValue:g.investmentPortfolio.marketValue+a}}));};

 const resolveChoice=ch=>{const d=ch.direct||{};if(d.cash<0&&game.cash<Math.abs(d.cash))return Alert.alert('Недостаточно денег');patch(g=>{let n=apply({...g,cash:g.cash+(d.cash||0),pendingEventId:null},{energy:d.energy||0,...(ch.hidden||{})});if(ch.special==='repair_phone')n.phoneCondition=clamp(n.phoneCondition+40);if(ch.special==='parents')n.housingId=n.relatives.mother?.alive?'parents':'homeless';const ac=activeCarState(n);if(ac&&ch.special==='repair_car')n.cars=n.cars.map(x=>x.uid===ac.uid?{...x,condition:clamp(x.condition+35)}:x);if(ac&&ch.special==='damage_car')n.cars=n.cars.map(x=>x.uid===ac.uid?{...x,condition:clamp(x.condition-18)}:x);if(n.businesses.length&&ch.special?.startsWith('biz_'))n.businesses=n.businesses.map((x,i)=>i?x:{...x,condition:clamp((x.condition||100)+(ch.special==='biz_good'?30:ch.special==='biz_cheap'?12:-15))});n.memories=[...n.memories,{date:formatDate(n.date),age:n.age,text:ch.memory}].slice(-100);if(d.time)n=advance(n,d.time);return n;});setEventOpen(false);};

 const autoDay=g=>{let n={...g};if(scheduled(n)&&!n.career.workedToday){const r=roleByIds(n.career.companyId,n.career.roleId);if(r&&n.energy>=35&&n.satiety>=15&&n.fatigue<86){if(n.satiety<45){if(n.housingId==='parents'&&n.relatives.mother?.alive)n=apply(n,{satiety:46});else if(n.cash>=280)n=apply({...n,cash:n.cash-280},{satiety:46});}n=workPure(n);}}if(n.pendingEventId)return n;if(n.satiety<40){if(n.housingId==='parents'&&n.relatives.mother?.alive)n=apply(n,{satiety:46});else if(n.cash>=280)n=apply({...n,cash:n.cash-280},{satiety:46});}if(n.pendingEventId)return n;const till=((1320-n.timeMinutes)+1440)%1440;if(till>0&&till<720)n=advance(n,till);if(n.pendingEventId)return n;n=apply(n,{energy:70,fatigue:-62,stress:-7,mood:1,longTermHealth:.05,sleepHistory:.1});return advance(n,480);};
 const ff=mode=>patch(g=>{let n={...g},max=mode==='day'?1:mode==='week'?7:30;for(let i=0;i<max;i++){if(n.pendingEventId)break;n=autoDay(n);if(n.pendingEventId)break;if(mode==='event'){n=eventify(n,i>=2);if(n.pendingEventId)break;}}return n;});

 const reset=()=>Alert.alert('Начать новую жизнь?','Весь прогресс будет удалён.',[{text:'Отмена'},{text:'Удалить',style:'destructive',onPress:async()=>{await AsyncStorage.removeItem(SAVE_KEY);setGame(START);setScreen('today');}}]);

 if(!loaded)return <View style={styles.loading}><ActivityIndicator/><Text style={styles.loadingText}>Загрузка…</Text></View>;
 if(!game.alive)return <SafeAreaView style={styles.app}><StatusBar barStyle="light-content"/><ScrollView contentContainerStyle={styles.content}><Text style={styles.kicker}>ЖИЗНЬ ЗАВЕРШЕНА</Text><Text style={[styles.hero,{fontSize:64,marginTop:20}]}>{game.age}</Text><Text style={styles.sub}>лет · {game.causeOfDeath||'естественные причины'}</Text><Section title="Итог"/><View style={styles.bigCard}><Row l1="Прожито дней" v1={`${game.stats.daysLived}`} l2="Капитал" v2={`${money(capital)} ₴`}/><View style={styles.divider}/><Text style={styles.small}>Решения, здоровье, стресс, питание, сон и качество жизни влияли на продолжительность жизни персонажа.</Text></View><Pressable style={styles.buy} onPress={reset}><Text style={styles.buyText}>Начать новую жизнь</Text></Pressable></ScrollView></SafeAreaView>;

 const common={game,company,role,phone,housing,capital,doWork,eat,eatHome,sleep,study,workout,gigOK,doGig,join,quit,buyPhone,sellPhone,buyCar,sellCar,chooseHousing,sellProp,buyBiz,sellBiz,borrow,repay,invest,marketTab,setMarketTab,patch,ff,reset};

 return <SafeAreaView style={styles.app}>
  <StatusBar barStyle="light-content"/>
  <Header game={game} onSleep={()=>setSleepOpen(true)}/>
  <View style={styles.main}>
   {screen==='today'&&<Today {...common}/>}
   {screen==='career'&&<Career {...common}/>}
   {screen==='finance'&&<Finance {...common}/>}
   {screen==='market'&&<Market {...common}/>}
   {screen==='assets'&&<Assets {...common}/>}
  </View>
  <Nav screen={screen} setScreen={setScreen}/>
  <SleepModal visible={sleepOpen} game={game} onClose={()=>setSleepOpen(false)} onSleep={h=>{setSleepOpen(false);sleep(h);}}/>
  <EventModal visible={eventOpen&&!!game.pendingEventId} event={EVENTS[game.pendingEventId]} onChoice={resolveChoice}/>
 </SafeAreaView>;
}

function Header({game,onSleep}){
 const needs=[['Энергия',game.energy,false],['Сытость',game.satiety,false],['Здоровье',game.health,false],['Усталость',game.fatigue,true],['Стресс',game.stress,true],['Настроение',game.mood,false]];
 return <View style={styles.header}>
  <View style={styles.headerTop}>
   <View style={{flex:1}}><Text style={styles.logo}>LIFE</Text><Text style={styles.headerDate}>{weekday(game.date)} · {formatDate(game.date)} · {formatTime(game.timeMinutes)}</Text></View>
   <View style={styles.moneyBox}><Text style={styles.moneyLabel}>НАЛИЧНЫЕ</Text><Text style={styles.moneyValue}>{money(game.cash)} ₴</Text></View>
   <Pressable style={styles.sleepBtn} onPress={onSleep}><Text style={styles.moon}>☾</Text><Text style={styles.sleepTxt}>Сон</Text></Pressable>
  </View>
  <View style={styles.needGrid}>{needs.map(([l,v,i])=><Need key={l} label={l} value={v} inverse={i}/>)}</View>
 </View>;
}
function Need({label,value,inverse}){const v=clamp(value);let c=C.green;if(inverse){if(v>=75)c=C.red;else if(v>=45)c=C.yellow;}else{if(v<=28)c=C.red;else if(v<=55)c=C.yellow;}return <View style={styles.need}><View style={styles.needTop}><Text style={styles.needLabel}>{label}</Text><Text style={styles.needVal}>{Math.round(v)}%</Text></View><View style={styles.track}><View style={[styles.fill,{width:`${v}%`,backgroundColor:c}]}/></View></View>;}

function Today({game,company,role,phone,housing,capital,doWork,eat,eatHome,study,workout,ff}){
 const tr=commute(game),car=activeCarBase(game),debt=game.debts.filter(x=>x.status==='active').sort((a,b)=>a.dueSerial-b.dueSerial)[0];
 return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
  <Text style={styles.kicker}>{weekday(game.date).toUpperCase()}</Text><Text style={styles.hero}>{game.age} лет</Text><Text style={styles.sub}>{company&&role?`${company.name} · ${role.name}`:'Постоянной работы нет'}</Text>
  <View style={styles.bigCard}><Text style={styles.caption}>Чистый капитал</Text><Text style={styles.bigMoney}>{money(capital)} ₴</Text><View style={styles.divider}/><Row l1="Сегодня" v1={scheduled(game)?game.career.workedToday?'Смена отработана':'Рабочий день':'Выходной'} l2="Транспорт" v2={car?`${car.brand} ${car.model}`:'Общественный'}/></View>
  <Section title="Быстрые действия" right={formatTime(game.timeMinutes)}/>
  {scheduled(game)&&role&&<Action title={game.career.workedToday?'Смена отработана':`Работать · ${role.hours} ч`} sub={`${company.name} · дорога ${tr.minutes} мин`} meta={game.career.workedToday?'Готово':'Рабочая смена'} disabled={game.career.workedToday} onPress={doWork}/>}
  <Action title="Самообразование" sub="2 часа · интеллект" meta="−18 энергии" onPress={study}/>
  <Action title="Тренировка" sub="1 ч 30 мин · здоровье и форма" meta="−22 энергии" onPress={workout}/>
  <Section title="Питание" right={`Сытость ${Math.round(game.satiety)}%`}/>
  {game.housingId==='parents'&&<Action title="Поесть дома" sub={`За счёт семьи · ${game.familyMealsToday}/${game.relatives.mother?.relationship>=65?3:2}`} meta="Бесплатно" onPress={eatHome}/>}
  <View style={styles.miniRow}><Mini title="Перекус" value="120 ₴" onPress={()=>eat('cheap')}/><Mini title="Обычная еда" value="280 ₴" onPress={()=>eat('normal')}/><Mini title="Хорошая еда" value="650 ₴" onPress={()=>eat('good')}/></View>
  <Section title="Ускорить жизнь" right="остановится на событии"/>
  <View style={styles.miniRow}><Mini title="День" value="1 день" onPress={()=>ff('day')}/><Mini title="Неделя" value="до 7 дней" onPress={()=>ff('week')}/><Mini title="До события" value="до 30 дней" onPress={()=>ff('event')}/></View>
  <Section title="Что важно сейчас"/>
  <Status label="Телефон" value={phone?`${phone.brand} ${phone.model} · ${Math.round(game.phoneCondition)}%`:'Телефона нет'} warn={!phone||game.phoneCondition<35}/>
  <Status label="Жильё" value={housing.name}/>
  <Status label="Дорога на работу" value={role?`${tr.type==='car'?'На машине':'Общественный транспорт'} · ${tr.minutes} мин`:'Нет работы'}/>
  {debt&&<Status label="Ближайший долг" value={`${debt.title}: ${money(debt.balance)} ₴`} warn/>}
 </ScrollView>;
}

function Career({game,company,role,join,quit,gigOK,doGig}){
 return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
  <Text style={styles.kicker}>КАРЬЕРА</Text><Text style={styles.hero}>Работа и подработки</Text><Text style={styles.sub}>Выбери компанию и расти внутри неё.</Text>
  {company&&role&&<><Section title="Текущая компания"/><View style={styles.bigCard}><Text style={styles.caption}>{company.sector.toUpperCase()}</Text><Text style={styles.cardTitle}>{company.name}</Text><Text style={styles.sub}>{role.name}</Text><Text style={styles.green}>{money(role.salary)} ₴ / месяц</Text><View style={styles.divider}/><Row l1="В компании" v1={`${game.career.companyMonths} мес.`} l2="Прогулы" v2={`${game.career.attendance.absences}`}/><Pressable onPress={quit}><Text style={styles.dangerText}>Уволиться</Text></Pressable></View></>}
  <Section title="Компании"/>
  {COMPANIES.map(c=><View key={c.id} style={[styles.company,game.career.companyId===c.id&&styles.active]}>
   <Text style={styles.caption}>{c.sector.toUpperCase()}</Text><Text style={styles.cardTitle}>{c.name}</Text>
   {c.roles.map((r,i)=>{const ok=roleOK(c,r),cur=game.career.companyId===c.id&&game.career.roleId===r.id;return <Pressable key={r.id} style={[styles.role,cur&&styles.roleActive]} onPress={()=>join(c,r)}>
    <View style={styles.num}><Text style={styles.numText}>{i+1}</Text></View><View style={{flex:1}}><Text style={styles.roleTitle}>{r.name}</Text><Text style={styles.small}>{money(r.salary)} ₴ · {r.hours} ч · Пн–Пт</Text>{!ok&&!cur&&<Text style={styles.req}>Инт {r.req.i} · Хар {r.req.c} · Навык {r.req.s} · Реп {r.req.r}{r.min?` · стаж ${r.min} мес.`:''}</Text>}</View><Text style={[styles.state,{color:cur?C.green:ok?C.accent:C.muted}]}>{cur?'ТЕКУЩАЯ':ok?'ДОСТУПНО':'ЗАКРЫТО'}</Text>
   </Pressable>;})}
  </View>)}
  <Section title="Подработки" right="оплата день в день"/>
  {SIDE_GIGS.map(x=>{const ok=gigOK(x),done=game.sideGigDoneToday[x.id];return <Pressable key={x.id} disabled={!ok||done} onPress={()=>doGig(x)} style={[styles.gig,(!ok||done)&&{opacity:.45}]}><View style={{flex:1}}><Text style={styles.roleTitle}>{x.name}</Text><Text style={styles.small}>{x.hours} ч · −{x.energy} энергии</Text>{!ok&&<Text style={styles.redSmall}>Не выполнены требования</Text>}</View><Text style={styles.green}>{done?'Готово':`${money(x.pay)} ₴`}</Text></Pressable>;})}
 </ScrollView>;
}

function Finance({game,role,borrow,repay,invest,capital}){
 const debts=game.debts.filter(x=>x.status==='active');
 return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
  <Text style={styles.kicker}>ФИНАНСЫ</Text><Text style={styles.hero}>Деньги</Text><Text style={styles.sub}>Помощь близких, кредиты, МФО и инвестиции.</Text>
  <View style={styles.bigCard}><Text style={styles.caption}>Чистый капитал</Text><Text style={styles.bigMoney}>{money(capital)} ₴</Text><View style={styles.divider}/><Row l1="Долги" v1={`${money(debts.reduce((s,d)=>s+d.balance,0))} ₴`} l2="Зарплата" v2={role?`${money(role.salary)} ₴`:'Нет'}/></View>
  <Section title="Занять деньги"/><Offer title="Попросить у мамы" sub="Без процентов, но отношения имеют значение" opts={[3000,5000,10000]} pick={a=>borrow('mother',a)}/><Offer title="Банковский кредит" sub="Меньше ставка, строгая оценка" opts={[10000,30000,70000]} pick={a=>borrow('bank',a)}/><Offer title="Микрозайм" sub="Легче получить, дорого при просрочке" opts={[3000,7000,15000]} pick={a=>borrow('micro',a)} danger/>
  <Section title="Активные долги" right={`${debts.length}`}/>{!debts.length&&<Empty text="Долгов нет."/>}
  {debts.map(d=><View key={d.uid} style={styles.product}><Text style={styles.caption}>{d.kind==='micro'?'МФО':d.kind==='bank'?'БАНК':'ЛИЧНЫЙ ДОЛГ'}</Text><Text style={styles.cardTitle}>{d.title}</Text><Text style={styles.price}>{money(d.balance)} ₴</Text><Text style={styles.small}>{d.lateMarked?'ПРОСРОЧЕН':'До срока '+Math.max(0,d.dueSerial-serial(game.date))+' дней'}</Text><View style={styles.buttons}><Btn text="1 000 ₴" onPress={()=>repay(d,1000)}/><Btn text="5 000 ₴" onPress={()=>repay(d,5000)}/><Btn text="Погасить" onPress={()=>repay(d,d.balance)}/></View></View>)}
  <Section title="Инвестиции"/><View style={styles.bigCard}><Text style={styles.caption}>ПОРТФЕЛЬ</Text><Text style={styles.cardTitle}>{money(game.investmentPortfolio.marketValue)} ₴</Text><Text style={[styles.green,{color:game.investmentPortfolio.lastMonthReturn>=0?C.green:C.red}]}>{game.investmentPortfolio.lastMonthReturn>=0?'+':''}{money(game.investmentPortfolio.lastMonthReturn)} ₴ за прошлый месяц</Text><View style={styles.buttons}>{[1000,5000,10000].map(a=><Btn key={a} text={`+${money(a)} ₴`} onPress={()=>invest(a)}/>)}</View></View>
 </ScrollView>;
}

function Market({game,buyPhone,buyCar,chooseHousing,buyBiz,marketTab,setMarketTab}){
 return <View style={{flex:1}}><View style={styles.tabs}>{[['phones','Техника'],['cars','Авто'],['housing','Жильё'],['business','Бизнес']].map(([id,t])=><Pressable key={id} onPress={()=>setMarketTab(id)} style={[styles.tab,marketTab===id&&styles.tabActive]}><Text style={[styles.tabText,marketTab===id&&{color:C.text}]}>{t}</Text></Pressable>)}</View>
  <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
   {marketTab==='phones'&&<><Text style={styles.kicker}>ТЕХНИКА</Text><Text style={styles.hero}>Телефоны</Text><Text style={styles.sub}>Старый телефон ограничивает цифровые вакансии и подработки.</Text>{PHONES.map(p=><Prod key={p.id} title={`${p.brand} ${p.model}`} price={p.price} current={game.phoneId===p.id} foot={`Производительность ${p.performance} · престиж ${p.prestige}`} onPress={()=>buyPhone(p)}/>)}</>}
   {marketTab==='cars'&&<><Text style={styles.kicker}>АВТО</Text><Text style={styles.hero}>Автосалоны</Text><Text style={styles.sub}>Машина сокращает дорогу и открывает подработки, но требует содержания.</Text>{CARS.map(c=><Prod key={c.id} title={`${c.brand} ${c.model}`} price={c.price} foot={`Надёжность ${c.reliability} · комфорт ${c.comfort} · ≈${money(c.monthly)} ₴/мес.`} onPress={()=>buyCar(c)}/>)}</>}
   {marketTab==='housing'&&<><Text style={styles.kicker}>ЖИЛЬЁ</Text><Text style={styles.hero}>Где жить</Text>{HOUSING.filter(h=>h.id!=='homeless').map(h=><Prod key={h.id} title={h.name} price={h.type==='buy'?h.price:h.monthly} current={game.housingId===h.id} foot={`Комфорт ${h.comfort}${h.type==='rent'?' · аренда в месяц':''}`} onPress={()=>chooseHousing(h)}/>)}</>}
   {marketTab==='business'&&<><Text style={styles.kicker}>БИЗНЕС</Text><Text style={styles.hero}>Свой бизнес</Text>{BUSINESSES.map(b=><Prod key={b.id} title={b.name} price={b.price} foot={`Средняя выручка до расходов ≈ ${money(b.daily)} ₴/день`} onPress={()=>buyBiz(b)}/>)}</>}
  </ScrollView>
 </View>;
}

function Assets({game,phone,housing,capital,sellPhone,sellCar,sellProp,sellBiz,patch,reset}){
 return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
  <Text style={styles.kicker}>АКТИВЫ</Text><Text style={styles.hero}>{money(capital)} ₴</Text><Text style={styles.sub}>Имущество можно продать даже если оно единственное.</Text>
  <Section title="Телефон"/>{phone?<View style={styles.bigCard}><Text style={styles.caption}>{phone.brand}</Text><Text style={styles.cardTitle}>{phone.model}</Text><Text style={styles.small}>Состояние {Math.round(game.phoneCondition)}% · эффективность {Math.round(phonePerf(game))}</Text><Pressable onPress={sellPhone}><Text style={styles.dangerText}>Продать телефон</Text></Pressable></View>:<Empty text="Телефона нет. Часть функций недоступна."/>}
  <Section title="Автомобили"/>{!game.cars.length&&<Empty text="Автомобилей нет."/>}{game.cars.map(o=>{const b=carById(o.catalogId);return <View key={o.uid} style={[styles.product,game.activeCarId===o.uid&&styles.active]}><Text style={styles.caption}>{b.brand}</Text><Text style={styles.cardTitle}>{b.model}</Text><Text style={styles.small}>Состояние {Math.round(o.condition)}% · {money(o.mileage||0)} км</Text><View style={styles.buttons}><Btn text={game.activeCarId===o.uid?'Используется':'Использовать'} onPress={()=>patch({activeCarId:o.uid})}/><Btn text="Продать" danger onPress={()=>sellCar(o)}/></View></View>;})}
  <Section title="Жильё"/><Status label="Сейчас живёшь" value={housing.name}/>{game.properties.map(o=><View key={o.uid} style={styles.product}><Text style={styles.cardTitle}>{housingById(o.catalogId).name}</Text><Text style={styles.small}>Состояние {Math.round(o.condition||100)}%</Text><Pressable onPress={()=>sellProp(o)}><Text style={styles.dangerText}>Продать недвижимость</Text></Pressable></View>)}
  <Section title="Бизнесы"/>{!game.businesses.length&&<Empty text="Бизнесов нет."/>}{game.businesses.map(o=>{const b=BUSINESSES.find(x=>x.id===o.catalogId);return <View key={o.uid} style={styles.product}><Text style={styles.cardTitle}>{b.name}</Text><Text style={[styles.green,{color:(o.lastMonthProfit||0)>=0?C.green:C.red}]}>{(o.lastMonthProfit||0)>=0?'+':''}{money(o.lastMonthProfit||0)} ₴</Text><Text style={styles.small}>Состояние {Math.round(o.condition||100)}%</Text><Pressable onPress={()=>sellBiz(o)}><Text style={styles.dangerText}>Продать бизнес</Text></Pressable></View>;})}
  <Section title="История жизни"/>{[...game.memories].reverse().slice(0,15).map((m,i)=><View key={i} style={styles.memory}><Text style={styles.caption}>{m.date} · {m.age} лет</Text><Text style={styles.memoryText}>{m.text}</Text></View>)}
  <Pressable style={{padding:20,alignItems:'center'}} onPress={reset}><Text style={styles.dangerText}>Начать новую жизнь</Text></Pressable>
 </ScrollView>;
}

function EventModal({visible,event,onChoice}){if(!event)return null;return <Modal visible={visible} transparent animationType="fade"><View style={styles.overlay}><View style={styles.sheet}><Text style={styles.eventCat}>{event.cat.toUpperCase()}</Text><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventText}>{event.text}</Text>{event.choices.map((c,i)=><Pressable key={i} style={styles.choice} onPress={()=>onChoice(c)}><View style={{flex:1}}><Text style={styles.choiceTitle}>{c.label}</Text><Text style={styles.choiceCost}>{directText(c.direct)}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}<Text style={styles.hint}>Показаны только непосредственные затраты. Скрытые последствия не раскрываются.</Text></View></View></Modal>;}
function SleepModal({visible,game,onClose,onSleep}){return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.overlay}><Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}/><View style={styles.sheet}><View style={styles.row}><Text style={styles.eventTitle}>Сколько спать?</Text><Pressable onPress={onClose}><Text style={styles.close}>×</Text></Pressable></View><Text style={styles.sub}>Сейчас {formatTime(game.timeMinutes)} · энергия {Math.round(game.energy)}% · усталость {Math.round(game.fatigue)}%</Text><ScrollView style={{maxHeight:430}}>{[4,5,6,7,8,9,10,11,12].map(h=><Pressable key={h} style={styles.choice} onPress={()=>onSleep(h)}><View style={styles.hourBox}><Text style={styles.hour}>{h}</Text><Text style={styles.small}>ч</Text></View><View style={{flex:1}}><Text style={styles.choiceTitle}>Сон {h} часов</Text><Text style={styles.choiceCost}>Подъём {game.timeMinutes+h*60>=1440?'завтра, ':''}{formatTime(game.timeMinutes+h*60)}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}</ScrollView></View></View></Modal>;}
function Nav({screen,setScreen}){return <View style={styles.nav}>{[['today','Сегодня'],['career','Карьера'],['finance','Деньги'],['market','Рынок'],['assets','Активы']].map(([id,t])=><Pressable key={id} style={styles.navItem} onPress={()=>setScreen(id)}><View style={[styles.marker,screen===id&&styles.markerOn]}/><Text style={[styles.navText,screen===id&&{color:C.text}]}>{t}</Text></Pressable>)}</View>;}

function Section({title,right}){return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{right&&<Text style={styles.sectionRight}>{right}</Text>}</View>;}
function Action({title,sub,meta,onPress,disabled}){return <Pressable style={[styles.action,disabled&&{opacity:.45}]} disabled={disabled} onPress={onPress}><View style={{flex:1}}><Text style={styles.roleTitle}>{title}</Text><Text style={styles.small}>{sub}</Text></View><Text style={styles.meta}>{meta}</Text></Pressable>;}
function Mini({title,value,onPress}){return <Pressable style={styles.mini} onPress={onPress}><Text style={styles.roleTitle}>{title}</Text><Text style={styles.green}>{value}</Text></Pressable>;}
function Status({label,value,warn}){return <View style={styles.status}><Text style={styles.small}>{label}</Text><Text style={[styles.statusVal,warn&&{color:C.yellow}]}>{value}</Text></View>;}
function Row({l1,v1,l2,v2}){return <View style={styles.row}><View style={{flex:1}}><Text style={styles.small}>{l1}</Text><Text style={styles.statusVal}>{v1}</Text></View><View style={{flex:1,alignItems:'flex-end'}}><Text style={styles.small}>{l2}</Text><Text style={[styles.statusVal,{textAlign:'right'}]}>{v2}</Text></View></View>;}
function Offer({title,sub,opts,pick,danger}){return <View style={[styles.product,danger&&{borderColor:'#47282C'}]}><Text style={styles.roleTitle}>{title}</Text><Text style={styles.small}>{sub}</Text><View style={styles.buttons}>{opts.map(a=><Btn key={a} text={`${money(a)} ₴`} danger={danger} onPress={()=>pick(a)}/>)}</View></View>;}
function Btn({text,onPress,danger}){return <Pressable style={[styles.btn,danger&&styles.dangerBtn]} onPress={onPress}><Text style={[styles.btnText,danger&&{color:C.red}]}>{text}</Text></Pressable>;}
function Prod({title,price,foot,current,onPress}){return <View style={[styles.product,current&&styles.active]}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.price}>{money(price)} ₴</Text>{foot&&<Text style={styles.small}>{foot}</Text>}<Pressable disabled={current} style={[styles.buy,current&&{opacity:.45}]} onPress={onPress}><Text style={styles.buyText}>{current?'Используется':'Купить / выбрать'}</Text></Pressable></View>;}
function Empty({text}){return <Text style={styles.empty}>{text}</Text>;}

const styles=StyleSheet.create({
 app:{flex:1,backgroundColor:C.bg},main:{flex:1},loading:{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'},loadingText:{color:C.sub,marginTop:12},
 header:{backgroundColor:'#0C1014',borderBottomWidth:1,borderBottomColor:'#1B222A',paddingHorizontal:12,paddingTop:7,paddingBottom:8},
 headerTop:{flexDirection:'row',alignItems:'center'},logo:{color:C.text,fontSize:15,fontWeight:'900',letterSpacing:3.4},headerDate:{color:C.muted,fontSize:8.2,marginTop:3},
 moneyBox:{alignItems:'flex-end',marginHorizontal:8},moneyLabel:{color:C.muted,fontSize:6.4,fontWeight:'800',letterSpacing:.8},moneyValue:{color:C.text,fontSize:13,fontWeight:'800',marginTop:1},
 sleepBtn:{width:45,height:36,borderRadius:10,backgroundColor:C.surface2,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},moon:{color:C.accent,fontSize:13},sleepTxt:{color:C.text,fontSize:7,fontWeight:'700'},
 needGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',marginTop:8,rowGap:6},need:{width:'32%',minWidth:0},needTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:3},needLabel:{color:C.sub,fontSize:7.2,fontWeight:'600'},needVal:{color:C.text,fontSize:7.2,fontWeight:'800'},
 track:{height:4,borderRadius:4,backgroundColor:'#272D34',overflow:'hidden'},fill:{height:'100%',borderRadius:4},
 scroll:{flex:1},content:{paddingHorizontal:18,paddingTop:22,paddingBottom:38},kicker:{color:C.muted,fontSize:9,fontWeight:'800',letterSpacing:1.3,marginBottom:6},hero:{color:C.text,fontSize:29,fontWeight:'800',letterSpacing:-.7},sub:{color:C.sub,fontSize:11,lineHeight:17,marginTop:5},
 bigCard:{marginTop:18,padding:16,borderRadius:17,backgroundColor:C.surface,borderWidth:1,borderColor:C.border},caption:{color:C.muted,fontSize:8,fontWeight:'800',letterSpacing:.6},bigMoney:{color:C.text,fontSize:28,fontWeight:'800',marginTop:5},cardTitle:{color:C.text,fontSize:17,fontWeight:'750',marginTop:5},
 green:{color:C.green,fontSize:11,fontWeight:'750',marginTop:7},divider:{height:1,backgroundColor:C.border,marginVertical:14},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 section:{marginTop:26,marginBottom:9,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},sectionTitle:{color:C.text,fontSize:15,fontWeight:'750'},sectionRight:{color:C.muted,fontSize:8.2,maxWidth:'55%',textAlign:'right'},
 action:{minHeight:64,borderRadius:14,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,paddingHorizontal:13,paddingVertical:11,marginBottom:8,flexDirection:'row',alignItems:'center'},roleTitle:{color:C.text,fontSize:12,fontWeight:'700'},small:{color:C.muted,fontSize:8.5,lineHeight:13,marginTop:4},meta:{color:C.sub,fontSize:8.5,marginLeft:9,maxWidth:90,textAlign:'right'},
 miniRow:{flexDirection:'row',gap:7},mini:{flex:1,minHeight:60,borderRadius:13,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,padding:10,justifyContent:'center'},
 status:{minHeight:49,borderRadius:13,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,paddingHorizontal:12,paddingVertical:9,marginBottom:7,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},statusVal:{color:C.text,fontSize:9.5,fontWeight:'650',maxWidth:'66%',textAlign:'right',marginTop:3},
 company:{borderRadius:16,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,marginBottom:10,overflow:'hidden',paddingTop:14},active:{borderColor:'#50577C'},company:{borderRadius:16,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,marginBottom:10,overflow:'hidden',paddingTop:14,paddingHorizontal:14},
 role:{minHeight:72,borderTopWidth:1,borderTopColor:C.border,marginHorizontal:-14,paddingHorizontal:13,paddingVertical:10,flexDirection:'row',alignItems:'center'},roleActive:{backgroundColor:'#141B18'},num:{width:28,height:28,borderRadius:8,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center',marginRight:9},numText:{color:C.sub,fontSize:9,fontWeight:'800'},req:{color:C.muted,fontSize:7.4,lineHeight:11,marginTop:4},state:{fontSize:6.8,fontWeight:'800',marginLeft:7},
 gig:{minHeight:67,borderRadius:14,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,padding:12,marginBottom:8,flexDirection:'row',alignItems:'center'},redSmall:{color:C.red,fontSize:7.8,marginTop:4},
 product:{padding:15,borderRadius:15,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,marginBottom:9},price:{color:C.text,fontSize:19,fontWeight:'800',marginTop:10},buttons:{flexDirection:'row',gap:7,marginTop:12},btn:{flex:1,minHeight:39,borderRadius:10,backgroundColor:C.surface2,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},dangerBtn:{backgroundColor:'#191214',borderColor:'#42262B'},btnText:{color:C.text,fontSize:8.5,fontWeight:'700'},
 buy:{minHeight:44,marginTop:14,borderRadius:11,backgroundColor:'#EEF0F4',alignItems:'center',justifyContent:'center'},buyText:{color:'#0A0D10',fontSize:10.5,fontWeight:'800'},dangerText:{color:C.red,fontSize:9.5,fontWeight:'650',marginTop:12},
 tabs:{minHeight:47,paddingHorizontal:9,flexDirection:'row',alignItems:'center',gap:4,borderBottomWidth:1,borderBottomColor:'#191E24',backgroundColor:'#0D1014'},tab:{flex:1,height:33,borderRadius:9,alignItems:'center',justifyContent:'center'},tabActive:{backgroundColor:C.surface2},tabText:{color:C.muted,fontSize:8.5,fontWeight:'650'},
 memory:{paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.border},memoryText:{color:C.text,fontSize:10,lineHeight:15,marginTop:4},empty:{color:C.muted,fontSize:9.5,lineHeight:15,paddingVertical:14},
 nav:{minHeight:61,flexDirection:'row',backgroundColor:'#0C0F13',borderTopWidth:1,borderTopColor:'#1A2026',paddingTop:6},navItem:{flex:1,alignItems:'center',justifyContent:'center'},marker:{width:5,height:3,borderRadius:3,backgroundColor:'#343B45',marginBottom:7},markerOn:{width:19,backgroundColor:C.accent},navText:{color:'#59616C',fontSize:8},
 overlay:{flex:1,backgroundColor:'rgba(0,0,0,.74)',justifyContent:'flex-end'},sheet:{backgroundColor:'#12161B',borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,borderColor:C.border,padding:19,paddingBottom:27},eventCat:{color:C.accent,fontSize:8,fontWeight:'900',letterSpacing:1.1},eventTitle:{color:C.text,fontSize:21,fontWeight:'800',marginTop:5},eventText:{color:C.sub,fontSize:11,lineHeight:17,marginTop:8,marginBottom:10},
 choice:{minHeight:59,borderRadius:12,backgroundColor:C.surface2,borderWidth:1,borderColor:C.border,paddingHorizontal:12,paddingVertical:9,marginTop:7,flexDirection:'row',alignItems:'center'},choiceTitle:{color:C.text,fontSize:11,fontWeight:'650'},choiceCost:{color:C.yellow,fontSize:8.2,marginTop:4},arrow:{color:C.muted,fontSize:20,marginLeft:7},hint:{color:C.muted,fontSize:7.2,lineHeight:11,marginTop:12},close:{color:C.sub,fontSize:22},hourBox:{width:42,height:42,borderRadius:10,backgroundColor:C.surface,alignItems:'center',justifyContent:'center',marginRight:10},hour:{color:C.text,fontSize:15,fontWeight:'800'}
});

export default App;

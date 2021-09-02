import jsdom from 'jsdom';
import dayjs from 'dayjs';
import isoCountries from '../../utils/county_code.js';

const getDOMDocument = (data) => new jsdom.JSDOM(data).window.document;

const getRowText = (row) => {
  const td = row.querySelector('td.text-center');
  return td ? td.textContent.trim() : null;
};
const getLeftTrPart = (el) => el.firstElementChild.textContent.trim();
const getRightTrPart = (el) => el.lastElementChild.textContent.trim();

const getText = (td) => td.textContent.trim();
const getOnlyIntPercent = (percent) => `${Math.round(Number(percent.slice(0, -1), 10))}%`;

export const getStringFromPredictionHtml = (data) => {
  // @user (Cascade) SKillous [P] 19 y.o. | #29 World, #12 Non-KR, #1 RU | matches 1399 | earned $19k | form vP·57% vT·55% vZ·72%
  const document = getDOMDocument(data);

  const getRowFormOpRace = (table) =>
    [...table.rows].find((row) => getRowText(row) === 'Form vs. opposing race');
  const getRowScoreEachOther = (table) =>
    [...table.rows].find((row) => getRowText(row) === 'Score vs. each other');

  const table = document.querySelector('table.table-striped');

  const p1Name = getLeftTrPart(table.rows[0]).split(' ')[1];
  const p2Name = getRightTrPart(table.rows[0]).split(' ')[0];

  const p1Win = getOnlyIntPercent(getLeftTrPart(table.rows[2]));
  const p2Win = getOnlyIntPercent(getRightTrPart(table.rows[2]));

  const getFormOpRace = () => {
    const rowFormOpRace = getRowFormOpRace(table);
    if (rowFormOpRace) {
      const p1FormOpRace = getOnlyIntPercent(getLeftTrPart(rowFormOpRace).split(/[()]/)[1]);
      const p2FormOpRace = getOnlyIntPercent(getRightTrPart(rowFormOpRace).split(/[()]/)[1]);
      const strFormOpRace = ` | ${p1FormOpRace} form vs opp. race ${p2FormOpRace}`;
      return strFormOpRace;
    }
    return '';
  };

  const getEachOtherHistory = () => {
    const rowEachOtherHistory = getRowScoreEachOther(table);
    if (rowEachOtherHistory) {
      const p1EachOtherHistory = getOnlyIntPercent(getLeftTrPart(rowEachOtherHistory).split(/[()]/)[1]);
      const p2EachOtherHistory = getOnlyIntPercent(getRightTrPart(rowEachOtherHistory).split(/[()]/)[1]);
      const EachOtherHistory = ` | ${p1EachOtherHistory} history vs each other ${p2EachOtherHistory}`;
      return EachOtherHistory;
    }
    return '';
  };

  const str = `${p1Name} ${p1Win} vs ${p2Win} ${p2Name}${getFormOpRace()}${getEachOtherHistory()}`;
  return str;
};

export const getStringFromInfoPlayerHtml = (data) => {
  // (Cascade) SKillous [P] 19 y.o. | #29 World, #12 Non-KR, #1 RU | matches 1399 | earned $19k | form vP 57% vT 55% vZ 72%

  const document = getDOMDocument(data);

  const tableBio = [...document.querySelectorAll('table')].find((tableEl) =>
    tableEl.querySelector('th.ibox-header')
  );

  const name = getText(tableBio.rows[0]);
  const inactive = document.querySelector('.pull-left ~ * strong');

  const trNames = {
    Race: (str) => str[0],
    'Last match': (str) => str,
    Rank: (str) => {
      const ranks = str
        .replace(/\n/g, '')
        .replace(/\s{2,}/g, ',')
        .split(',');

      return ranks
        .map((areaStr) => {
          const [sign, ...areaArr] = areaStr.split(' ');
          const area = areaArr.join(' ');
          if (area === 'Non-Korean') {
            return `${sign} Non-KR`;
          }
          if (area === 'World') {
            return `${sign} ${area}`;
          }
          return `${sign} ${isoCountries[area.toLowerCase()]}`;
        })
        .join(', ');
    },
    Team: (str) => `(${str}) `,
    Birthday: (born) => `${dayjs().diff(born, 'years')} y.o. `,
    'Total earnings': (str) => {
      const dollars = Number(str.slice(1).replace(/,/g, ''));
      if (!dollars) {
        return `$0`;
      }
      const thousand =
        dollars < 1000 ? `$${(dollars / 1000).toFixed(1)}k` : `$${Math.round(dollars / 1000)}k`;
      return thousand;
    },
    'Matches played': (str) => str.split(' ')[0],
  };
  const rows = [...tableBio.rows].slice(1);

  const info = Object.fromEntries(
    Object.entries(trNames).map(([trLabel, fnFormat]) => {
      const row = rows.find((tr) => getText(tr.cells[0]) === trLabel);
      if (!row) {
        return [trLabel, ''];
      }
      const value = fnFormat(getText(row.cells[1]));
      return [trLabel, value];
    })
  );

  const tableForm = document.querySelector('#form table');
  const formRows = [...tableForm.rows].slice(1);
  const form = formRows
    .map((row) => [getText(row.cells[0]), getOnlyIntPercent(getText(row.cells[1]).split(' ')[0])])
    .filter(([, percent]) => percent !== '0%');
  const formStr = form.map(([title, percent]) => `${title}·${percent}`).join(' ');

  const rankOrInactive = inactive ? `Inactive since ${info['Last match']}` : info['Rank'];
  const formOrInactive = inactive || !formStr ? `` : ` | form ${formStr}`;
  const earnedStr = info['Total earnings'] ? ` | earned ${info['Total earnings']}` : '';
  const matchesStr = info['Matches played'] ? ` | matches ${info['Matches played']}` : '';
  const str = `${info['Team']}${name} [${info['Race']}] ${info['Birthday']}| ${rankOrInactive}${matchesStr}${earnedStr}${formOrInactive}`;
  return str;
};

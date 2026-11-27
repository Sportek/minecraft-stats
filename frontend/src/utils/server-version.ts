const VERSION_REGEX = /\d+\.\d+(?:\.\d+)?/g;
const LIST_SEPARATORS = [",", "-", "à", "/"];

function expandRange(start: string, end: string) {
  const [majorStart, minorStart, patchStart = 0] = start.split(".").map(Number);
  const [majorEnd, minorEnd, patchEnd = 0] = end.split(".").map(Number);

  const versions = [];

  if (majorStart === majorEnd && minorStart === minorEnd) {
    for (let patch = patchStart; patch <= patchEnd; patch++) {
      versions.push(`${majorStart}.${minorStart}.${patch}`);
    }
  } else if (majorStart === majorEnd) {
    for (let minor = minorStart; minor <= minorEnd; minor++) {
      versions.push(`${majorStart}.${minor}`);
    }
  } else {
    for (let major = majorStart; major <= majorEnd; major++) {
      const minorLimit = major === majorEnd ? minorEnd : 10;
      const minorStartCurrent = major === majorStart ? minorStart : 0;
      for (let minor = minorStartCurrent; minor <= minorLimit; minor++) {
        versions.push(`${major}.${minor}`);
      }
    }
  }

  return versions;
}

export function extractVersions(inputString: string) {
  const matches = inputString.match(VERSION_REGEX);
  if (!matches) return [];

  if (matches.length === 1) return [matches[0]];
  if (matches.length === 2 && inputString.includes("-")) return expandRange(matches[0], matches[1]);
  if (LIST_SEPARATORS.some((sep) => inputString.includes(sep))) return matches;
  return [];
}

export function formatVersion(versions: string[]) {
  if(versions.length === 0) {
    return "N/A";
  } else if(versions.length === 1) {
    return versions[0];
  } else {
    return `${versions[0]}-${versions[versions.length - 1]}`;
  }
}

export function extractVersions(inputString: string) {
  const versionRegex = /\d+\.\d+(?:\.\d+)?/g; // Régex pour capturer les versions de type 1.8, 1.20, 1.20.3, etc.

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

  function parseInput(inputString: string) {
    const matches = inputString.match(versionRegex);
    if (!matches) return [];

    if (matches.length === 1) {
      return [matches[0]]
    } else if (matches.length === 2 && inputString.includes("-")) {
      return expandRange(matches[0], matches[1]);
    } else if (inputString.includes(",") || inputString.includes("-") || inputString.includes("à") || inputString.includes("/")) {
      return matches;
    }

    return [];
  }

  return parseInput(inputString);
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

interface TooltipData {
  time: Date;
  playerCount: number;
}

interface TooltipOptions {
  isDarkMode: boolean;
}

export const generateTooltipHtml = (data: TooltipData, options: TooltipOptions) => {
  const { isDarkMode } = options;
  const bgColor = isDarkMode ? '#18181b' : '#ffffff';
  const borderColor = isDarkMode ? '#27272a' : '#e4e4e7';
  const dotColor = isDarkMode ? '#60A5FA' : '#2563EB';
  const textColor = isDarkMode ? '#a1a1aa' : '#71717a';
  const accentColor = isDarkMode ? '#60A5FA' : '#2563EB';
  const shadowColor = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';

  // Formatage de la date
  const formattedTime = data.time.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
  });

  // Formatage du nombre de joueurs avec séparateur de milliers
  const formattedPlayerCount = data.playerCount.toLocaleString('fr-FR');

  return `
    <div style="
      background: ${bgColor};
      border: 1px solid ${borderColor};
      border-radius: 0.25rem;
      box-shadow: 0 10px 15px -3px ${shadowColor}, 0 4px 6px -2px ${shadowColor};
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-family: system-ui, -apple-system, sans-serif;
      min-width: 200px;
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 0.75rem;
      ">
        <div style="
          width: 0.25rem;
          height: 0.25rem;
          border-radius: 9999px;
          background: ${dotColor};
          opacity: 0.5;
        "></div>
        <div style="
          color: ${textColor};
          font-size: 0.875rem;
          font-weight: 500;
        ">
          ${formattedTime}
        </div>
      </div>
      <div style="
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding-top: 0.25rem;
        border-top: 1px solid ${borderColor};
      ">
        <div style="
          width: 0.25rem;
          height: 0.25rem;
          border-radius: 9999px;
          background: ${dotColor};
          opacity: 0.5;
        "></div>
        <div style="
          color: ${accentColor};
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        ">
          <span>${formattedPlayerCount}</span>
          <span style="
            color: ${textColor};
            font-weight: 500;
          ">players</span>
        </div>
      </div>
    </div>
  `;
};

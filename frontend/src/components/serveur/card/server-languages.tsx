import { Language } from "@/types/server"

interface ServerLanguagesProps {  
  languages: Language[]
  className?: string
}

const ServerLanguages = ({ languages, className }: ServerLanguagesProps) => {
  if (languages.length === 0) return null;

  const displayedFlags = languages.slice(0, 3);
  const remainingCount = languages.length - 3;

  return (
    <div className={className}>
      <div className="relative group/languages inline-block">
        <div className="flex flex-row items-center cursor-pointer">
          <div className="flex -space-x-2">
            {displayedFlags.map((language, index) => (
              <span 
                key={language.id} 
                className="text-lg relative hover:z-20 hover:-translate-y-0.5 hover:drop-shadow-sm transition-all duration-200 ease-in-out"
                style={{ zIndex: 10 - index }}
                title={language.name}
              >
                {language.flag}
              </span>
            ))}
          </div>
          {remainingCount > 0 && (
            <span className="text-sm text-gray-500 ml-1.5 font-medium">
              +{remainingCount}
            </span>
          )}
        </div>

        <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover/languages:opacity-100 group-hover/languages:visible transition-all duration-200 ease-in-out z-30">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2">
              {languages.map((language) => (
                <div
                  key={language.id}
                  className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded transition-colors"
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {language.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerLanguages


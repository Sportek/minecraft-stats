import EndMCLogo from "@/images/endmc/endmc.png";
import { Icon } from "@iconify/react/dist/iconify.js";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const Vote = () => {
  const [isActive, setIsActive] = useState(true);
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute top-[20%] left-0 min-w-[250px] w-[25%] h-[50px] bg-[#2F0201] z-50 text-[#F8AE03] flex flex-row"
          initial={{ x: 0 }}
          animate={{ x: 0 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-grow h-full items-center p-4 gap-4">
            <Link href="https://discord.gg/endmc">
              <Image src={EndMCLogo} alt="EndMC Logo" width={32} height={32} />
            </Link>
            <div className="font-bold text-lg">Votez Sportek</div>
          </div>
          <Icon icon="mdi:close" className="cursor-pointer m-1" onClick={() => setIsActive(false)} />
          <div className="h-full w-[5px] bg-[#F8AE03]"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Vote;

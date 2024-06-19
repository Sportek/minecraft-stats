import Image from 'next/image'

export const metadata = {
  title: "API",
  description:
    "Discover our comprehensive API documentation, providing all the paths to access our resources, including Minecraft server data and more. Optimize your integration with detailed endpoints and methods, ensuring seamless data retrieval and interaction. Perfect for developers looking to enhance their applications with real-time server information.",
};

const ApiPage = () => {
  return (
	  <div className="flex flex-col items-center gap-10 my-auto">
		  <p className="text-2xl">Our API documentation is coming <a className="hover:underline" target="_blank" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">soon&trade;</a> ! Please check back later.</p>
		  <Image src="https://media1.tenor.com/m/2WtBkf2YI00AAAAd/bean-mr.gif" width="300" height="300" alt="Mr. Beans waiting meme"/>
	  </div>
  );
};

export default ApiPage;

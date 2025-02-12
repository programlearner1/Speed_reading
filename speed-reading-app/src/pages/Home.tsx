import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold">Speed Reading App</h1>
      <p className="text-lg mt-4">Improve your reading speed efficiently!</p>
      <Link to="/reader" className="mt-6 bg-blue-500 text-white px-4 py-2 rounded">
        Start Reading
      </Link>
    </div>
  );
};

export default Home;

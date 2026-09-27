import SearchBar from "../common/SearchBar"

function Header(){
    return(
    <header className="flex flex-col gap-4 px-4 py-4 shadow md:flex-row md:items-center md:justify-between md:px-8">
        <h1 className="text-2xl font-bold">VJ Shopping World</h1>

        <SearchBar />

        <nav className="flex gap-4 md:gap-6">
          <a href="#">Home</a>
          <a href="#">Products</a>
          <a href="#">Categories</a>
          <a href="#">Login</a>
        </nav>
      </header>
    )
}

export default Header;
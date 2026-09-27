import {useState} from "react"

function SearchBar(){

    const [search, setSearch] = useState("")

    return(
        <div>
            <input 
            type="text"
            value={search}
            onChange={(event)=>setSearch(event.target.value)}
            placeholder="Search Products....."
            className="w-96 rounded-lg border px-4 py-2" 
            />

            <p className="mt-2 text-sm text-gray-500">
                Searching for: {search}
            </p>
        </div>
    )
}

export default SearchBar;
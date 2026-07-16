import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react';
export const Route = createFileRoute('/')({
  component: RouteComponent,
})

interface Bookmark {
  bookmark_id: number,
  name: string,
  url: string,
  user_id: number
}

function RouteComponent() {

  const [tempBookmarkState, setTempBookmarkState] = useState<Bookmark[]>([]);

  useEffect(() => {
    try {
     fetch(`${process.env.EXPRESS_PUBLIC_API_BASE_URL}/bookmarks`, {
        method: "GET"
      }).then((response)=>{
        return response.json()
      }).then((data)=>{
        setTempBookmarkState(data);
      })

   
     


    } catch (error) {
      console.error(error)
    }
  }, [])

  console.log(tempBookmarkState)
  //FIXME: TEMPORARY
  return <div>
      {tempBookmarkState.map((bookmark) => (
        <div key={bookmark.bookmark_id}>
          <h3>{bookmark.name}</h3>
          <a href={bookmark.url}>{bookmark.url}</a>
        </div>
      ))}
    </div>
}

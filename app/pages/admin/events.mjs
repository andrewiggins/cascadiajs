function event(e) {
    return `<details>
        <summary>${ e ? e.name : 'New Event' }</summary>
        <p><a href="/admin/talks?event_id=${ e._id }">List Talks</a></p>
        <form action=/admin/events method=post>
          <input type=${ e ? 'hidden' : 'text' } name=_id placeholder="id" value="${ e ? e._id : '' }">
          <input type=text name=name placeholder="Name" value="${ e ? e.name : '' }">
          <button>Save</button>
        </form>
      </details>`
  }


export default function ({ html, state }) {
    const { events } = state.store
    return html`
        <admin-layout>
            <h1>Events</h1>
            ${ events.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map(event).join('')}
        </admin-layout>
    `
}
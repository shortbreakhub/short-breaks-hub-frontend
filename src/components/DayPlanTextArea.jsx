export default function DayPlanTextArea({day, plan,title,handleUpdateDayPlanContent,
                                            handleUpdateDayPlanTitle,handleDeleteDay,submitted}) {
    return(
        <div className="journal-day" data-item="day">
            <div className="journal-day__header">
                {/* Two-digit journal label (DAY 01) via CSS uppercase; numbering logic unchanged. */}
                <h3 className="journal-day__label">Day {String(day).padStart(2, "0")}</h3>
                { day === 1 ?
                    null:(<button type="button" className="journal-day__delete"
                                  data-action="delete-currentTime" onClick={()=>handleDeleteDay(day)}>Delete</button>
                    )}
            </div>
            <label className="journal-label">Title (optional)</label>
            <input
                type="text"
                placeholder="e.g. Morning at Gardens by the Bay"
                value={title}
                className="journal-input"
                onChange={(e) => handleUpdateDayPlanTitle(day, e.target.value)}
                data-field="currentTime-title"
            />
            <label className="journal-label">Plan</label>
            <textarea rows={3} placeholder="Morning at Gardens by the Bay, afternoon at Chinatown…"
                      value={plan}
                      className="journal-input"
                      data-field="currentTime-details"
                      onChange={(e) => handleUpdateDayPlanContent(day,e.target.value)}
            />
            {
                submitted ? plan.length > 30 && plan.length < 1900 ? null :
                    (<p className="journal-error text-red-700">Please make sure your details description more than 30 characters and less than 500 characters.</p>) : null
            }
        </div>
    )
}
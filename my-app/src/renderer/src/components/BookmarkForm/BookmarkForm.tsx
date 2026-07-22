import {
  BOOKMARK_NAME_MAX_LENGTH,
  BookmarkFormFields,
} from '@renderer/types/bookmark'
import './bookmark-form.css'

interface BookmarkFormProps {
  fields: BookmarkFormFields
  idPrefix: string
  onChange: (fields: BookmarkFormFields) => void
}

function BookmarkForm({ fields, idPrefix, onChange }: BookmarkFormProps) {
  return (
    <>
      <div className="bookmark-form__field">
        <label htmlFor={`${idPrefix}-name`} className="bookmark-form__label">
          Name
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          className="bookmark-form__input"
          value={fields.name}
          maxLength={BOOKMARK_NAME_MAX_LENGTH}
          onChange={(event) => onChange({ ...fields, name: event.target.value })}
          required
        />
        <p className="bookmark-form__hint">
          {fields.name.length}/{BOOKMARK_NAME_MAX_LENGTH} characters
        </p>
      </div>

      <div className="bookmark-form__field">
        <label htmlFor={`${idPrefix}-url`} className="bookmark-form__label">
          URL
        </label>
        <textarea
          id={`${idPrefix}-url`}
          className="bookmark-form__textarea"
          value={fields.url}
          onChange={(event) => onChange({ ...fields, url: event.target.value })}
          required
        />
      </div>
    </>
  )
}

export default BookmarkForm

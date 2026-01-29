import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';

type Props = {
  todosCountInfo: number[];
  focusTrigger: number;
  onAddNewTodo: (title: string) => Promise<void>;
  onToggleTodos: (completed: boolean) => void;
};

export const NewTodo: React.FC<Props> = ({
  todosCountInfo: [allTodosCount, activeTodosCount],
  onAddNewTodo,
  focusTrigger,
  onToggleTodos,
}) => {
  const [title, setTitle] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAllCompleted = activeTodosCount === 0;

  const handleNewTodo = (event: React.FormEvent) => {
    event.preventDefault();

    setIsDisabled(true);

    onAddNewTodo(title)
      .then(() => {
        setTitle('');
      })
      .catch(() => {})
      .finally(() => {
        setIsDisabled(false);
      });
  };

  const handleToggleTodos = () => {
    onToggleTodos(!isAllCompleted);
  };

  useEffect(() => {
    if (!isDisabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDisabled, focusTrigger]);

  return (
    <header className="todoapp__header">
      {allTodosCount > 0 && (
        <button
          type="button"
          className={classNames('todoapp__toggle-all', {
            active: isAllCompleted,
          })}
          data-cy="ToggleAllButton"
          onClick={handleToggleTodos}
        />
      )}

      <form
        onSubmit={event => {
          handleNewTodo(event);
        }}
      >
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={title}
          onChange={event => setTitle(event.target.value)}
          onKeyUp={e => {
            if (e.key === 'Escape') {
              setTitle('');
            }
          }}
          autoFocus
          disabled={isDisabled}
          ref={inputRef}
        />
      </form>
    </header>
  );
};

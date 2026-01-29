/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import {
  deleteTodo,
  getTodos,
  postTodo,
  updateTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList/TodoList';
import { TodoFooter } from './components/TodoFooter/TodoFooter';
import { NewTodo } from './components/NewTodo/NewTodo';
import { FilterOption } from './types/FilterOption';
import { ErrorMessage } from './types/ErrorMessage';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState(ErrorMessage.Default);
  const [hideError, setHideError] = useState(true);
  const [filterOption, setFilterOption] = useState(FilterOption.All);

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const activeTodosCount = todos.filter(todo => !todo.completed).length;
  const completedTodosCount = todos.length - activeTodosCount;

  let timerId = 0;

  const showError = (error: ErrorMessage) => {
    clearTimeout(timerId);
    setErrorMessage(error);
    setHideError(false);
    timerId = window.setTimeout(() => setHideError(true), 3000);
  };

  const filteredTodos = () => {
    switch (filterOption) {
      case FilterOption.Active:
        return todos.filter(todo => !todo.completed);
      case FilterOption.Completed:
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  };

  useEffect(() => {
    setHideError(true);
    getTodos()
      .then(setTodos)
      .catch(() => {
        showError(ErrorMessage.Load);
      });
  }, []);

  const handleAddNewTodo = (title: string): Promise<void> => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle.length) {
      showError(ErrorMessage.TitleEmpty);

      return Promise.reject();
    }

    setTempTodo({ title, id: 0, completed: false, userId: USER_ID });

    return postTodo(trimmedTitle)
      .then(newTodo => {
        setTodos(currentTodos => [...currentTodos, newTodo]);
      })
      .catch(() => {
        showError(ErrorMessage.Add);
        throw new Error();
      })
      .finally(() => {
        setTempTodo(null);
      });
  };

  const handleDeleteTodo = (id: number) => {
    setProcessingIds(prev => [...prev, id]);

    return deleteTodo(id)
      .then(() => {
        setTodos(curr => curr.filter(todo => todo.id !== id));
        setFocusTrigger(prev => prev + 1);
      })
      .catch(() => {
        showError(ErrorMessage.Delete);
      })
      .finally(() => {
        setProcessingIds(prev => prev.filter(currentId => currentId !== id));
      });
  };

  const handleDeleteCompletedTodos = () => {
    const completedIds = todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    setProcessingIds(prev => [...prev, ...completedIds]);
    const promises = completedIds.map(id => {
      return deleteTodo(id)
        .then(() => {
          setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));

          return true;
        })
        .catch(() => {
          return false;
        })
        .finally(() => {
          setProcessingIds(prev => prev.filter(procId => procId !== id));
        });
    });

    Promise.all(promises).then(results => {
      if (results.includes(false)) {
        showError(ErrorMessage.Delete);
      }

      setFocusTrigger(prev => prev + 1);
    });
  };

  const handleUpdateTodo = (updatedTodo: Todo) => {
    setProcessingIds(prev => [...prev, updatedTodo.id]);

    return updateTodo(updatedTodo)
      .then(responseTodo => {
        setTodos(currentTodos =>
          currentTodos.map(todo => {
            if (todo.id === updatedTodo.id) {
              return responseTodo;
            }

            return todo;
          }),
        );
      })
      .catch(() => {
        showError(ErrorMessage.Update);
        throw new Error();
      })
      .finally(() => {
        setProcessingIds(prev =>
          prev.filter(currentId => currentId !== updatedTodo.id),
        );
      });
  };

  const handleToggleTodos = (status: boolean) => {
    const neededUpdateTodos = todos.filter(todo => todo.completed === !status);

    const neededUpdateIds = neededUpdateTodos.map(todo => todo.id);

    setProcessingIds(prev => [...prev, ...neededUpdateIds]);

    const promises = neededUpdateTodos.map(todo => {
      return updateTodo({ ...todo, completed: status })
        .then(responseTodo => {
          setTodos(currentTodos =>
            currentTodos.map(t =>
              t.id === responseTodo.id ? responseTodo : t,
            ),
          );

          return true;
        })
        .catch(() => {
          return false;
        })
        .finally(() => {
          setProcessingIds(prev => prev.filter(procId => procId !== todo.id));
        });
    });

    Promise.all(promises).then(results => {
      if (results.includes(false)) {
        showError(ErrorMessage.Update);
      }
    });
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <NewTodo
          todosCountInfo={[todos.length, activeTodosCount]}
          onAddNewTodo={handleAddNewTodo}
          focusTrigger={focusTrigger}
          onToggleTodos={handleToggleTodos}
        />

        {todos.length > 0 && (
          <TodoList
            todos={filteredTodos()}
            tempTodo={tempTodo}
            onTodoDelete={handleDeleteTodo}
            onTodoUpdate={handleUpdateTodo}
            processingIds={processingIds}
          />
        )}
        {(todos.length > 0 || tempTodo) && (
          <TodoFooter
            activeTodosCount={activeTodosCount}
            completedTodosCount={completedTodosCount}
            selectedFilter={filterOption}
            onFilterChange={setFilterOption}
            onClearCompleted={handleDeleteCompletedTodos}
          />
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: hideError },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setHideError(true)}
        />
        {errorMessage}
      </div>
    </div>
  );
};

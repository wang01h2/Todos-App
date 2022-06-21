import {useAutoAnimate} from "solid-auto-animate";
import {createEffect, createMemo, For, onCleanup, onMount, Show,} from "solid-js";
import {createStore, produce} from "solid-js/store";
import "todomvc-app-css/index.css";

const LOCAL_STORAGE_KEY = "todos-solid";

function createLocalStore(defaultValue: ITodoStore) {
    // 在初始化时加载 localStorage 中的待办事项
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const [state, setState] = createStore<ITodoStore>(
        stored ? JSON.parse(stored) : defaultValue
    );
    // 值改变就保存到 localStorage
    createEffect(() =>
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
    );
    return {state, setState};
}

let App = () => {
    let ulBoxRef: HTMLUListElement | undefined = undefined;
    onMount(() => {
        if (ulBoxRef != undefined) {
            useAutoAnimate(() => ulBoxRef!, {});
        }
    });
    let {state, setState} = createLocalStore({
        counter: 1,
        todos: [],
        showMode: "all",
        editingTodoId: null,
    });
    /** 剩余数量 */
    let remainingCount = createMemo(() => {
        let completedCount = state.todos.filter((todo) => todo.completed).length;
        return state.todos.length - completedCount;
    });
    /** 过滤列表 */
    let filterList = (todos: ITodoModel[]) => {
        if (state.showMode === "active") {
            return todos.filter((todo) => !todo.completed);
        } else if (state.showMode === "completed") {
            return todos.filter((todo) => todo.completed);
        } else {
            return todos;
        }
    };
    let removeTodo = (todoId: number) => {
        setState("todos", (t) => t.filter((item) => item.id !== todoId));
    };
    let editTodo = (todo: PickRequired<ITodoModel, "id">) => {
        setState("todos", (item) => item.id === todo.id, todo);
    };
    let clearCompleted = () => {
        setState("todos", (t) => t.filter((todo) => !todo.completed));
    };
    let toggleAll = (completed: boolean) => {
        setState("todos", (todo) => todo.completed !== completed, {completed});
    };
    let setEditing = (todoId: number) => {
        setState("editingTodoId", todoId);
    };
    let addTodo = (target: HTMLInputElement, keyCode: string) => {
        const title = target.value.trim();
        if (keyCode === "Enter" && title) {
            setState(
                produce((v) => {
                    v.todos.push({id: state.counter, title: title, completed: false});
                    v.counter++;
                })
            );
            // 清空文本框
            target.value = "";
        }
    };
    let save = (id: number, value: string) => {
        const title = value.trim();
        if (state.editingTodoId === id && title) {
            editTodo({id: id, title: value});
            setEditing(-1);
        }
    };
    let toggle = (todoId: number, checked: boolean) => {
        editTodo({id: todoId, completed: checked});
    };
    let doneEditing = (todoId: number, keyCode: string, value: string) => {
        if (keyCode === "Enter") {
            save(todoId, value);
        } else if (keyCode === "Escape") {
            setEditing(-1);
        }
    };
    const locationHandler = () => {
        // 使用切片去掉前2位字符 eg: #/active  -> active
        let value: any = location.hash.slice(2);
        setState("showMode", value || "all");
    };
    /** 监听 地址栏 hashChange */
    window.addEventListener("hashchange", locationHandler);
    /** 清理 */
    onCleanup(() => window.removeEventListener("hashchange", locationHandler));
    return (
        <section class="todoapp">
            <header class="header">
                <h1>Todos</h1>
                <input
                    class="new-todo"
                    placeholder="需要做些什么?"
                    onKeyDown={(e) => {
                        addTodo(e.currentTarget, e.code);
                    }}
                />
            </header>
            <div style={state.todos.length == 0 ? {display: "none"} : {}}>
                <section class="main">
                    <input
                        id="toggle-all"
                        class="toggle-all"
                        type="checkbox"
                        checked={!remainingCount()}
                        onInput={(v) => toggleAll(v.currentTarget.checked)}
                    />
                    <label for="toggle-all" title="全部完成"/>
                    <ul class="todo-list" ref={ulBoxRef}>
                        <For each={filterList(state.todos)}>
                            {(todo) => (
                                <li
                                    class="todo"
                                    classList={{
                                        editing: state.editingTodoId === todo.id,
                                        completed: todo.completed,
                                    }}
                                >
                                    <div class="view">
                                        <input
                                            class="toggle"
                                            type="checkbox"
                                            checked={todo.completed}
                                            onInput={(e) => toggle(todo.id, e.currentTarget.checked)}
                                        />
                                        <label onDblClick={() => setEditing(todo.id)}>
                                            {todo.title}
                                        </label>
                                        <button
                                            class="destroy"
                                            onClick={() => removeTodo(todo.id)}
                                        />
                                    </div>
                                    <Show when={state.editingTodoId === todo.id}>
                                        <input
                                            class="edit"
                                            value={todo.title}
                                            onFocusOut={(e) => {
                                                save(todo.id, e.currentTarget.value);
                                            }}
                                            onKeyUp={(e) =>
                                                doneEditing(todo.id, e.code, e.currentTarget.value)
                                            }
                                            ref={(el) => {
                                                // 创建后,聚焦到这个输入框
                                                setTimeout(() => el.focus());
                                            }}
                                        />
                                    </Show>
                                </li>
                            )}
                        </For>
                    </ul>
                </section>
                <footer class="footer">
                    <span class="todo-count">剩余<strong>{remainingCount()}</strong>项</span>
                    <ul class="filters">
                        <li>
                            <a href="#/" classList={{selected: state.showMode === "all"}}>
                                全部
                            </a>
                        </li>
                        <li>
                            <a
                                href="#/active"
                                classList={{selected: state.showMode == "active"}}
                            >
                                未完成
                            </a>
                        </li>
                        <li>
                            <a
                                href="#/completed"
                                classList={{selected: state.showMode === "completed"}}
                            >
                                已完成
                            </a>
                        </li>
                    </ul>
                    <Show when={remainingCount() !== state.todos.length}>
                        <button class="clear-completed" onClick={clearCompleted}>
                            清理已完成的数据
                        </button>
                    </Show>
                </footer>
            </div>
        </section>
    );
};
export default App;

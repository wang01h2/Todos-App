// @ts-ignore
interface ITodoModel {
    id: number;
    completed: boolean;
    title: string;
}

interface ITodoStore {
     counter: number;
     todos: ITodoModel[];
     showMode: "all" | "active" | "completed";
     editingTodoId: number | undefined | null;
 }

/** 只将传入的这几个变为必填项, 其余的都变为非必填
* @example* PickRequired < MyModel, 'id'|'name'|'age' >
  *
  *     */
 type PickRequired<T, I extends keyof T> = Required<Pick<T, I>> &Partial<Omit<T, I>>;

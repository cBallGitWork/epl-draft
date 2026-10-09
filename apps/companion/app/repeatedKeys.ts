import { isValidElement, type ReactNode } from "react";

/** Every React key repeated among siblings in a tree, rendering function components on the way down, for a test to
 *  ask of a list: a server render never warns, and a repeated key drops or doubles a row on the next one. A component
 *  that holds a hook has to be mocked first. */
export function repeatedKeys(node: ReactNode): string[] {
  if (Array.isArray(node)) {
    const keys = node.flatMap((child) => (isValidElement(child) && child.key !== null ? [child.key] : []));
    return [...keys.filter((key, at) => keys.indexOf(key) !== at), ...node.flatMap(repeatedKeys)];
  }
  if (!isValidElement(node)) return [];
  const props = node.props as { children?: ReactNode };
  return typeof node.type === "function"
    ? repeatedKeys((node.type as (props: object) => ReactNode)(props))
    : repeatedKeys(props.children);
}

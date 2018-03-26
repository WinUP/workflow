export async function asPromise<T>(input: any): Promise<T> {
    if (input instanceof Promise) {
        return input;
    } else {
        return new Promise<T>((resolve, reject) => resolve(input));
    }
}

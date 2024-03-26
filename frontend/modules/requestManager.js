class RequestManager {
    #aborter = new AbortController();

    reset() {
        this.#aborter.abort();
        this.#aborter = new AbortController();
    }

    getSignal() {
        return this.#aborter.signal;
    }
}

const ReqManager = new RequestManager();

export default ReqManager;
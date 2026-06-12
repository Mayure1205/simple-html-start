package com.chainsight.exception;

public class RpcFetchException extends RuntimeException {
    public RpcFetchException(String message, Throwable cause) {
        super(message, cause);
    }
}

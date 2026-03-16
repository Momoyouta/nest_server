export class Result<T = any> {
  code: number;
  msg: string;
  data: T;

  constructor(code: number, msg: string, data: T) {
    this.code = code;
    this.msg = msg;
    this.data = data;
  }

  /**
   * 成功返回
   * @param msg 消息
   * @param data 数据
   */
  static success<T>(msg = 'success', data: T): Result<T> {
    return new Result(200, msg, data);
  }

  /**
   * 错误返回
   * @param msg 消息
   * @param code 错误码
   */
  static error(msg = 'error', code = 500): Result<null> {
    return new Result(code, msg, null);
  }
}

package com.codegym.spring_boot.service.judge;

public interface OutputComparator {

    /**
     * Làm sạch chuỗi trước khi so sánh (Cắt khoảng trắng thừa, chuẩn hóa dấu xuống
     * dòng)
     * 
     * @param input Chuỗi raw từ user hoặc standard output
     * @return Chuỗi đã được chuẩn hóa
     */
    String sanitize(String input);

    /**
     * So sánh giá trị actual với expected
     * 
     * @param actual   Kết quả User in ra
     * @param expected Kết quả chuẩn
     * @return true nếu khớp, ngược lại false
     */
    boolean compare(String actual, String expected);

}

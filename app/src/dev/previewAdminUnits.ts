import type { AdminUnit } from '../lib/adminUnits'

const UNITS: AdminUnit[] = [
  {
    "id": "efba6e4b-6b6b-59d3-9fe7-5d8d2cfba188",
    "code": "92",
    "name": "Cần Thơ",
    "level": "province",
    "kind": "thanh_pho",
    "parent_id": null,
    "zone": "nam",
    "merged_from": "thành phố Cần Thơ, tỉnh Sóc Trăng và tỉnh Hậu Giang",
    "lat": 9.74372,
    "lng": 105.75695,
    "sort_order": 92
  },
  {
    "id": "c5ad6bc7-3dcb-5edf-a2cb-77b1f07cd319",
    "code": "48",
    "name": "Đà Nẵng",
    "level": "province",
    "kind": "thanh_pho",
    "parent_id": null,
    "zone": "trung",
    "merged_from": "thành phố Đà Nẵng và tỉnh Quảng Nam",
    "lat": 15.63153,
    "lng": 107.96644,
    "sort_order": 48
  },
  {
    "id": "158ae5d8-51da-5174-a959-395d215899e2",
    "code": "79",
    "name": "TP. Hồ Chí Minh",
    "level": "province",
    "kind": "thanh_pho",
    "parent_id": null,
    "zone": "nam",
    "merged_from": "TPHCM, tỉnh Bà Rịa - Vũng Tàu và tỉnh Bình Dương",
    "lat": 10.86436,
    "lng": 106.84363,
    "sort_order": 79
  },
  {
    "id": "978406c0-6d9b-5a8c-b6b9-193ea6d416e0",
    "code": "01",
    "name": "Hà Nội",
    "level": "province",
    "kind": "tinh",
    "parent_id": null,
    "zone": "bac",
    "merged_from": "giữ nguyên",
    "lat": 21.0001,
    "lng": 105.69801,
    "sort_order": 1
  },
  {
    "id": "6e45c1d6-e0c6-55df-89f3-159ccb59212a",
    "code": "00004",
    "name": "Phường Ba Đình",
    "level": "commune",
    "kind": "phuong",
    "parent_id": "978406c0-6d9b-5a8c-b6b9-193ea6d416e0",
    "zone": null,
    "merged_from": "Phường Quán Thánh, Phường Trúc Bạch, một phần diện tích TN, quy mô dân số của các phường Cửa Nam, Điện Biên, Đội Cấn, Kim Mã, Ngọc Hà, một phần diện tích TN của phường Thụy Khuê, phần còn lại của phường Cửa Đông, Đồng Xuân sau khi sắp Xếp",
    "lat": 21.03853,
    "lng": 105.83806,
    "sort_order": 0
  },
  {
    "id": "c5be2c21-fb71-51c4-856e-50cdff7c3ab1",
    "code": "00292",
    "name": "Phường Bạch Mai",
    "level": "commune",
    "kind": "phuong",
    "parent_id": "978406c0-6d9b-5a8c-b6b9-193ea6d416e0",
    "zone": null,
    "merged_from": "Phường Bạch Mai, Phường Bách Khoa, Phường Quỳnh Mai, một phần diện tích TN, quy mô dân số của các phường Minh Khai (quận Hai Bà Trưng), Phường Đồng Tâm, Phường Lê Đại Hành, Phường Phương Mai, Phường Trương Định, phần còn lại của phường Thanh Nhàn sau khi sắp xếp",
    "lat": 21.00221,
    "lng": 105.85196,
    "sort_order": 0
  },
  {
    "id": "69ef2752-58a4-595f-a9da-ac0bcff8af1a",
    "code": "00118",
    "name": "Phường Bồ Đề",
    "level": "commune",
    "kind": "phuong",
    "parent_id": "978406c0-6d9b-5a8c-b6b9-193ea6d416e0",
    "zone": null,
    "merged_from": "Phường Ngọc Lâm, một phần diện tích TN, quy mô dân số của các phường Đức Giang, Phường Gia Thụy, Phường Thượng Thanh, một phần diện tích TN phường Phúc Đồng, Phường Ngọc Thụy (phần còn lại sau khi sáp nhập vào phường Hồng Hà), Phường Bồ Đề (phần còn lại sau khi sáp nhập vào phường Hồng Hà, phường Long Biên), Phường Long Biên (phần còn lại sau khi sáp nhập vào phường Long Biên)",
    "lat": 21.05137,
    "lng": 105.87052,
    "sort_order": 0
  },
  {
    "id": "7f1cb574-37f1-5ee6-af5a-bf316479c9f5",
    "code": "00166",
    "name": "Phường Cầu Giấy",
    "level": "commune",
    "kind": "phuong",
    "parent_id": "978406c0-6d9b-5a8c-b6b9-193ea6d416e0",
    "zone": null,
    "merged_from": "Phường Dịch Vọng, Phường Dịch Vọng Hậu, Phường Quan Hoa, Phường Mỹ Đình 1, Phường Mỹ Đình 2, Phường Yên Hòa",
    "lat": 21.03091,
    "lng": 105.78806,
    "sort_order": 0
  },
  {
    "id": "d62e2e12-bec0-5aa2-866e-0d55f73b37f0",
    "code": "10015",
    "name": "Phường Chương Mỹ",
    "level": "commune",
    "kind": "phuong",
    "parent_id": "978406c0-6d9b-5a8c-b6b9-193ea6d416e0",
    "zone": null,
    "merged_from": "Phường Biên Giang, Thị trấn Chúc Sơn, Xã Đại Yên, Xã Ngọc Hòa, Xã Phụng Châu, Xã Tiên Phương, Xã Thuỵ Hương, Phường Đồng Mai (phần còn lại sau khi sáp nhập vào phường Yên Nghĩa)",
    "lat": 20.92488,
    "lng": 105.69855,
    "sort_order": 0
  },
  {
    "id": "0543eeec-68d9-591b-b7f3-4fbe8c295f41",
    "code": "00082",
    "name": "Phường Cửa Nam",
    "level": "commune",
    "kind": "phuong",
    "parent_id": "978406c0-6d9b-5a8c-b6b9-193ea6d416e0",
    "zone": null,
    "merged_from": "Phường Hàng Bài, Phường Phan Chu Trinh, Phường Trần Hưng Đạo, một phần diện tích TN, quy mô dân số của các phường Phường Cửa Nam, Phường Nguyễn Du, Phường Phạm Đình Hổ và phần còn lại của các Phường Hàng Bông, Phường Hàng Trống, Phường Tràng Tiền",
    "lat": 21.02264,
    "lng": 105.85074,
    "sort_order": 0
  },
  {
    "id": "fa9ba8cd-d8e6-5b65-96e9-58d8c71a9a2f",
    "code": "00637",
    "name": "Phường Đại Mỗ",
    "level": "commune",
    "kind": "phuong",
    "parent_id": "978406c0-6d9b-5a8c-b6b9-193ea6d416e0",
    "zone": null,
    "merged_from": "Phường Đại Mỗ, Phường Dương Nội, Phường Mộ Lao, Phường Mễ Trì (phần còn lại sau khi sáp nhập vào phường Yên Hòa, phường Từ Liêm), Phường Nhân Chính (phần còn lại sau khi sáp nhập vào phường Thanh Xuân, phường Yên Hòa), Phường Trung Hòa (phần còn lại sau khi sáp nhập vào phường Thanh Xuân, phường Yên Hòa), Phường Phú Đô (phần còn lại sau khi sáp nhập vào phường Từ Liêm), Phường Trung Văn (phần còn lại sau khi sáp nhập vào phường Thanh Xuân)",
    "lat": 20.99356,
    "lng": 105.77536,
    "sort_order": 0
  },
  {
    "id": "9d1bdd0b-de03-5d78-b494-4c0bfeece838",
    "code": "00316",
    "name": "Phường Định Công",
    "level": "commune",
    "kind": "phuong",
    "parent_id": "978406c0-6d9b-5a8c-b6b9-193ea6d416e0",
    "zone": null,
    "merged_from": "Phường Định Công, Phường Hoàng Liệt, Phường Thịnh Liệt, Xã Tân Triều, Xã Thanh Liệt, một phần diện tích TN, quy mô dân số của các phường Phường Đại Kim, Phường Giáp Bát (phần còn lại sau khi sáp nhập vào phường Hoàng Mai, phường Tương Mai)",
    "lat": 20.97688,
    "lng": 105.8249,
    "sort_order": 0
  }
]

export function previewAdminUnits(): AdminUnit[] {
  return UNITS
}

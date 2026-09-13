import { describe, expect, it } from 'vitest'
import { groupActivities, groupTrips, type PostLike } from './albumGrouping'

const name = (code: string) => ({ LDG: 'Lâm Đồng', HNI: 'Hà Nội' })[code] ?? code

function post(
  id: string,
  happened_on: string,
  province_code: string | null = null,
  activity: string | null = null,
): PostLike {
  return { id, happened_on, province_code, activity }
}

describe('groupTrips', () => {
  it('gom bài liên tiếp cùng tỉnh thành một chuyến', () => {
    const trips = groupTrips(
      [
        post('a', '2026-03-01', 'LDG'),
        post('b', '2026-03-02', 'LDG'),
        post('c', '2026-03-03', 'LDG'),
      ],
      name,
    )
    expect(trips).toHaveLength(1)
    expect(trips[0].title).toBe('Lâm Đồng · 2026')
    expect(trips[0].postIds).toEqual(['a', 'b', 'c'])
  })

  it('cách nhau quá 2 ngày là hai chuyến khác nhau', () => {
    const trips = groupTrips(
      [
        post('a', '2026-03-01', 'LDG'),
        post('b', '2026-03-02', 'LDG'),
        post('c', '2026-03-03', 'LDG'),
        post('d', '2026-06-01', 'LDG'),
        post('e', '2026-06-02', 'LDG'),
        post('f', '2026-06-03', 'LDG'),
      ],
      name,
    )
    expect(trips).toHaveLength(2)
    // mới nhất trước
    expect(trips[0].startOn).toBe('2026-06-01')
  })

  it('dưới 3 bài thì không thành chuyến', () => {
    const trips = groupTrips(
      [post('a', '2026-03-01', 'LDG'), post('b', '2026-03-02', 'LDG')],
      name,
    )
    expect(trips).toEqual([])
  })

  it('bỏ qua bài chưa biết tỉnh', () => {
    const trips = groupTrips(
      [
        post('a', '2026-03-01'),
        post('b', '2026-03-02'),
        post('c', '2026-03-03'),
      ],
      name,
    )
    expect(trips).toEqual([])
  })

  it('cách đúng 2 ngày vẫn là cùng một chuyến', () => {
    const trips = groupTrips(
      [
        post('a', '2026-03-01', 'HNI'),
        post('b', '2026-03-03', 'HNI'),
        post('c', '2026-03-05', 'HNI'),
      ],
      name,
    )
    expect(trips).toHaveLength(1)
  })
})

describe('groupActivities', () => {
  it('gom theo hoạt động trong phạm vi một năm', () => {
    const albums = groupActivities([
      post('a', '2026-01-01', null, 'food'),
      post('b', '2026-05-01', null, 'food'),
      post('c', '2026-09-01', null, 'food'),
      post('d', '2027-01-01', null, 'food'),
    ])
    expect(albums).toHaveLength(1)
    expect(albums[0].title).toBe('Ăn uống · 2026')
    expect(albums[0].postIds).toEqual(['a', 'b', 'c'])
  })

  it('bỏ qua bài không gắn hoạt động', () => {
    expect(
      groupActivities([
        post('a', '2026-01-01'),
        post('b', '2026-02-01'),
        post('c', '2026-03-01'),
      ]),
    ).toEqual([])
  })
})

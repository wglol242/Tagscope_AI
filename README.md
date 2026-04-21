# 🏷️ Tagscope AI

### AI를 활용한 북마크 자동 분류 및 지능형 탐색 시스템

<p align="center">
  <img src="https://github.com/user-attachments/assets/36c2cae7-dbc7-406a-90b4-c2915ca7eca3" width="700"/>
</p>

> **AI 사피엔스 경진대회 최우수상 수상**

---

## 1. 핵심 정보 요약

| 항목 | 내용 |
|------|------|
| **기간** | 2025.06 ~ 2025.09 |
| **작업 인원** | 2명 |
| **역할** | 백엔드 담당, 기술 구현 |
| **기술 스택** | Python, Docker, Gemini API |
| **성과** | AI 자동 태깅, 멀티 벡터 검색, 하이브리드 검색, LLM 리랭킹을 결합한 지능형 북마크 탐색 시스템 구현 |

---

## 2. 주요 기능

### 1) 원클릭 북마크 수집
- Chrome 확장 프로그램을 통해 현재 페이지를 클릭 한 번으로 저장
- 아이콘 색상 및 토스트 메시지로 저장 상태를 즉시 확인할 수 있도록 구현

### 2) AI 자동 분석 및 태깅
- 북마크 저장 시 제목과 URL 정보를 기반으로 요약, 태그, 카테고리를 자동 생성
- 생성된 요약과 태그를 임베딩하여 검색 가능한 구조로 저장

### 3) 하이브리드 검색
- **BM25 기반 키워드 검색**과 **벡터 기반 시맨틱 검색**을 결합
- 정확한 문서 검색과 유사 카테고리 탐색을 동시에 지원

### 4) AI 리랭킹
- 고급 검색 옵션 활성화 시 LLM이 1차 검색 결과를 연관도에 따라 재정렬
- 사용자의 검색 의도와 문맥에 더 적합한 결과를 상위에 배치

---

## 3. 시스템 아키텍처

- **Frontend**: React, Chrome Extension  
- **Backend**: FastAPI (Python)  
- **Database**: PostgreSQL + pgvector  
- **AI Integration**: Gemini API  
- **Deployment / Environment**: Docker

---

## 4. 구현 내용

### 북마크 수집 및 저장 파이프라인
- Chrome 확장 프로그램과 웹 애플리케이션을 통해 URL 입력 및 저장 기능 구현
- 저장 요청 시 서버에서 URL 정보와 메타데이터를 수집한 뒤 DB에 저장

### AI 기반 분석 자동화

#### 프롬프트 예시
```python
입력 데이터:
- Title: {title}
- Url: {url}
- BaseDomain: {base_domain}

작업:
1) Title 텍스트만 사용하여 간결하게 요약
2) Title 기반 상위 개념 8개 태그 생성 (한국어)
3) 사이트 유형 분류: Social, Media, Portal, Blog, Tool, News, Public, Etc

출력 JSON:
{
  "summary": "string",
  "tags": ["string", ...],
  "source_type": "Social|Media|Portal|Blog|Tool|News|Public|Etc"
}

```

- 제목 및 도메인 정보를 바탕으로 북마크 요약과 태그를 자동 생성
- 사이트 유형을 분류하여 북마크를 구조화된 정보로 관리할 수 있도록 구현

### 멀티 벡터 검색 구조 설계

<p align="center">
  <img src="https://github.com/user-attachments/assets/527817e6-34ad-4748-838b-8bf59a029bf8" width="700"/>
</p>

- 요약과 태그를 각각 별도 임베딩으로 저장하는 **Multi Vector Search** 구조 적용
- 단일 임베딩보다 다양한 검색 의도를 반영할 수 있도록 개선

### 하이브리드 검색 및 리랭킹

<p align="center">
  <img src="https://github.com/user-attachments/assets/56a604bf-c4e4-4cf2-a14d-7b44119c04fa" width="700"/>
</p>

#### 프롬프트 예시

```python
검색 키워드: {query}

후보 문서:
{docs_text}

작업:
1. 각 요약이 키워드와 직접적으로 연관되어 있는지 판단하세요.
2. 연관성이 전혀 없거나 약한 문서는 반드시 제외하세요.
3. 남은 문서를 관련성이 높은 순서대로 정렬하세요.
4. 최종 출력은 JSON 형식으로, 선택한 문서 인덱스만 포함하세요.

출력 예시:
{
  "relevant": [2, 5, 1]
}

```

- BM25, 요약 임베딩, 태그 임베딩 점수를 조합한 검색 구조 설계
- 고급 검색에서는 LLM 기반 리랭킹을 통해 검색 정확도를 향상

---

## 5. 실제 결과물 / 시연 영상 / 발표 자료

### 실제 화면
<p align="center">
  <img src="https://github.com/user-attachments/assets/36c2cae7-dbc7-406a-90b4-c2915ca7eca3" width="700"/>
</p>

### 시연 영상
[![Tagscope-Ai 데모](http://img.youtube.com/vi/7VTFM_E_Vh4/maxresdefault.jpg)](https://youtu.be/7VTFM_E_Vh4)

### 발표 자료
[PDF 자료](https://github.com/wglol242/Tagscope-Ai/blob/06b398d771742dcf548824af82f85162aaee9fd3/Tagscope-Ai%20ppt%EC%9E%90%EB%A3%8C.pdf)

---

## 6. 기술 스택

- **Frontend**: React, Chrome Extension
- **Backend**: Python, FastAPI
- **Database**: PostgreSQL, pgvector
- **AI / Search**: Gemini API
- **Environment**: Docker

---

## 7. 프로젝트 요약

Tagscope AI는 단순 키워드 검색의 한계를 보완하기 위해,  
**AI 자동 태깅**, **멀티 벡터 검색**, **하이브리드 검색**, **LLM 리랭킹**을 결합한 지능형 북마크 탐색 시스템입니다.

북마크를 단순 저장하는 수준을 넘어,  
사용자의 검색 의도와 의미를 반영해 원하는 정보를 더 정확하게 찾을 수 있도록 구현한 프로젝트입니다.

---

*Developed by 김원진, 전영웅*

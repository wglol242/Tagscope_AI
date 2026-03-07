# 🏷️ Tagscope AI (AI 사피엔스 경진대회 최우수)

**AI 기반 지능형 북마크 시스템**  
웹 애플리케이션과 크롬 확장 프로그램을 통한 스마트 북마크 탐색 솔루션

---

## 아이디어


저장은 했지만 찾기 힘든 북마크, 단순 키워드 검색의 한계를 넘어 **의미와 맥락**을 파악해 원하는 정보를 정확하게 찾는 북마크를 만들어보자!

## 동작 다이어그램 (북마크 추가)

<img width="1147" height="527" alt="image" src="https://github.com/user-attachments/assets/fc8644f5-67b8-40e9-870a-14df62589ab8" />


## 주요 기능

### 1. 원클릭 북마크 수집
- Chrome 확장 프로그램을 통해 웹 서핑 중 클릭 한 번으로 손쉽게 현재 페이지를 저장합니다. 
- **시각적 피드백**: 아이콘 색상(회색/주황색/파란색)으로 저장 상태를 즉시 확인합니다. 
- **실시간 알림**: 토스트 메시지로 저장 성공, 실패, 중복 여부를 안내합니다. 

### 2. AI 자동 분석 및 태깅

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
{{
  "summary": "string",
  "tags": ["string",...],
  "source_type": "Social|Media|Portal|Blog|Tool|News|Public|Etc"
}}
```


- 북마크 저장과 동시에 AI가 콘텐츠를 분석하여 제목 요약, 태그, 카테고리를 자동 생성합니다. 
- 요약 임베딩과 태그 임베딩 등 다중 벡터(Multi Vector)를 생성합니다.

 **다중 벡터**: 요약(embedding_summary)과 태그(embedding_tags)를 각각 별도의 벡터로 만들어 다중 벡터 검색

 임베딩 모델: gemini-embedding-001 (1536차원) 사용

### 3. 하이브리드 검색 (Hybrid Search)



<img width="1147" height="302" alt="image" src="https://github.com/user-attachments/assets/527817e6-34ad-4748-838b-8bf59a029bf8" />

<br>

- **키워드 검색(BM25)**: 가장 빈도가 높은 키워드를 빠르게 검색합니다. 
- **시맨틱 검색**: 세밀한 요약 임베딩과 포괄적인 태그 임베딩을 동시 사용하여 '정확한 문서'와 '유사 카테고리 문서'를 모두 탐색합니다. 
- 세 가지 점수에 가중치를 적용·합산하여 검색 정확도를 대폭 향상시킵니다. 

### 4. AI 리랭킹 (고급 검색)



<img width="1027" height="361" alt="image" src="https://github.com/user-attachments/assets/56a604bf-c4e4-4cf2-a14d-7b44119c04fa" />


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
{{
  "relevant": [2, 5, 1]
}}
```


- 고급 검색 옵션 활성화 시, LLM이 1차 검색 결과를 사용자의 검색 의도에 맞게 재정렬합니다. 
- 단어의 의미와 맥락을 파악해 가장 적합한 북마크를 최상단에 배치하고 관련 없는 북마크는 제거합니다.

리랭킹 모델: gemini-2.5-flash 사용

## 사용 공식

<img width="1182" height="465" alt="image" src="https://github.com/user-attachments/assets/36b9589c-b9a3-47ac-8a12-b0f8c1511f30" />

<br>

**BM25** : 정보 검색에서 가장 널리 쓰이는 키워드 기반 문서 유사도 알고리즘

**Multi Vector Search** : AI 임베딩 모델을 통해 텍스트를 숫자로 이루어진 '벡터'로 변환한 뒤, 두 벡터가 가리키는 방향이 얼마나 비슷한지 각도를 측정하는 공식

**가중치 학슴** : 사용자의 검색 및 클릭 패턴을 분석하여 하이브리드 검색의 가중치를 자동으로 조절하는 공식

## 아키텍처

- **사용자 인터페이스 (Frontend)**: Chrome Extension, React
- **서버 (Backend)**: FastAPI (Python) 
- **데이터베이스 (DB)**: PostgreSQL + pgvector 
- **AI 연동**: Gemini 모델 (프롬프트 엔지니어링) 
- **실행 환경**: Docker를 통한 전체 시스템 통합 관리 


## 시스템 동작 흐름

1. **사용자 입력**: 확장 프로그램 아이콘 클릭 또는 웹앱에서 URL 입력 
2. **요청 전송**: Frontend에서 FastAPI 서버로 북마크 추가 요청 
3. **AI 분석**: 서버가 URL 정보를 수집하고 AI 모델에 분석 요청 
4. **DB 저장**: AI가 생성한 요약, 태그, 벡터를 PostgreSQL에 저장 
5. **응답 및 UI 업데이트**: 처리 결과를 Frontend에 반환하고 목록 새로고침 


## 실제 사진

<img width="1046" height="657" alt="image" src="https://github.com/user-attachments/assets/36c2cae7-dbc7-406a-90b4-c2915ca7eca3" />

## 발표 자료

[PDF 자료](https://github.com/wglol242/Tagscope-Ai/blob/06b398d771742dcf548824af82f85162aaee9fd3/Tagscope-Ai%20ppt%EC%9E%90%EB%A3%8C.pdf)

## 시연 영상
*(썸네일을 클릭하면 영상이 재생됩니다.)*

[![Tagscope-Ai 데모](http://img.youtube.com/vi/7VTFM_E_Vh4/maxresdefault.jpg)](https://youtu.be/7VTFM_E_Vh4)


## 참고 자료

https://monday9pm.com/reranker%EB%A5%BC-%EC%82%AC%EC%9A%A9%ED%95%B4%EC%95%BC%ED%95%98%EB%8A%94-%EC%9D%B4%EC%9C%A0-1553c85dee01

---
*Developed by 김원진, 전영웅*
